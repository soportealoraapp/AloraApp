import { createClient } from '../client'
import { Message } from '@/lib/domain/types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { subscribeWithReconnect } from '../realtime-reconnect'

type MessageCallback = (messages: Message[]) => void
type NewMessageCallback = (message: Message) => void
type PresenceCallback = (online: boolean) => void
type TypingCallback = (typingUserIds: string[]) => void

const messageCache = new Map<string, { messages: Message[]; offset: number; hasMore: boolean }>()
const typingChannels = new Map<string, { channel: any; supabase: ReturnType<typeof createClient>; userId: string }>()

export function deduplicate(messages: Message[]): Message[] {
    const seen = new Set<string>()
    return messages.filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
    })
}

function normalizeMessage(row: any): Message {
    return {
        id: row.id,
        matchId: row.matchId,
        senderId: row.senderId,
        content: row.content,
        createdAt: new Date(row.createdAt),
        readAt: row.readAt ? new Date(row.readAt) : undefined,
        type: row.type || 'text',
        status: row.status || 'sent',
        reactions: row.reactions || {},
    }
}

export const chatService = {
    /**
     * Subscribe to all messages for a match.
     * Initial fetch is the most recent `limit` messages, ordered newest -> oldest.
     * Realtime delivery is for new INSERTs only.
     */
    subscribeToMessages(
        matchId: string,
        callback: MessageCallback,
        options?: { limit?: number; offset?: number }
    ) {
        const supabase = createClient()
        const limit = options?.limit || 50
        const cacheKey = matchId

        // Initial fetch (newest first; we reverse for chronological display)
        let query = supabase
            .from('messages')
            .select('*')
            .eq('matchId', matchId)
            .order('createdAt', { ascending: false })
            .limit(limit)

        let knownIds = new Set<string>()

        query.then(({ data, error }) => {
            if (error) {
                console.error('Error fetching messages:', error)
                return
            }
            if (data) {
                // Reverse to oldest -> newest for display
                const messages = (data as any[]).map(normalizeMessage).reverse()
                knownIds = new Set(messages.map(m => m.id))
                messageCache.set(cacheKey, { messages, offset: 0, hasMore: data.length === limit })
                callback(messages)
            }
        })

        // Realtime subscription for new messages and status updates
        const { channel, cleanup: cleanupChannel } = subscribeWithReconnect(
            supabase,
            `match:${matchId}`,
            (ch) =>
                ch
                    .on(
                        'postgres_changes' as any,
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `matchId=eq.${matchId}`,
                        },
                        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
                            const newMsg = payload.new as any
                            if (!newMsg || !newMsg.id) return
                            if (knownIds.has(newMsg.id)) return
                            knownIds.add(newMsg.id)

                            const message = normalizeMessage(newMsg)
                            const cached = messageCache.get(cacheKey)
                            if (cached) {
                                cached.messages = deduplicate([...cached.messages, message])
                                callback(cached.messages)
                            } else {
                                callback([message])
                            }
                        }
                    )
                    .on(
                        'postgres_changes' as any,
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'messages',
                            filter: `matchId=eq.${matchId}`,
                        },
                        (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
                            const updatedMsg = payload.new as any
                            if (!updatedMsg || !updatedMsg.id) return

                            const message = normalizeMessage(updatedMsg)
                            const cached = messageCache.get(cacheKey)
                            if (cached) {
                                cached.messages = cached.messages.map(m => m.id === message.id ? message : m)
                                callback(cached.messages)
                            }
                        }
                    ),
        )

        return () => {
            cleanupChannel()
            messageCache.delete(cacheKey)
        }
    },

    /**
     * Subscribe to typing indicators using Supabase presence.
     *
     * Presence keys are unique per-user (we use the user id as the key), so each
     * participant occupies a distinct slot in the presence state. The receiver
     * can filter out their own key and read the rest as "currently typing".
     */
    subscribeToTyping(matchId: string, userId: string, callback: TypingCallback) {
        const supabase = createClient()
        const channel = supabase.channel(`typing:${matchId}`, {
            config: { presence: { key: userId } },
        })

        const collect = () => {
            const state = channel.presenceState()
            const typingUserIds = Object.keys(state).filter(id => id !== userId)
            callback(typingUserIds)
        }

        channel
            .on('presence' as any, { event: 'sync' }, collect)
            .on('presence' as any, { event: 'join' }, collect)
            .on('presence' as any, { event: 'leave' }, collect)
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },

    async emitTyping(matchId: string, userId: string) {
        const supabase = createClient()
        const key = `typing:${matchId}`

        let entry = typingChannels.get(key)
        if (!entry) {
            // Store a pending promise immediately to prevent race conditions
            const pendingEntry = {} as any
            typingChannels.set(key, pendingEntry)

            const channel = supabase.channel(key, {
                config: { presence: { key: userId } },
            })
            await new Promise<void>((resolve) => {
                channel.subscribe((status) => {
                    if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                        resolve()
                    }
                })
            })
            entry = { channel, supabase, userId }
            typingChannels.set(key, entry)
        }

        await entry.channel.track({ userId, typingAt: new Date().toISOString() })
    },

    closeTypingChannel(matchId: string) {
        const key = `typing:${matchId}`
        const entry = typingChannels.get(key)
        if (entry) {
            try { entry.channel.untrack() } catch { /* ignore */ }
            entry.supabase.removeChannel(entry.channel)
            typingChannels.delete(key)
        }
    },

    /**
     * Subscribe to online presence for a match.
     * The receiver is "online" if any presence key other than its own exists.
     */
    subscribeToPresence(matchId: string, userId: string, callback: PresenceCallback) {
        const supabase = createClient()
        const channel = supabase.channel(`presence:${matchId}`, {
            config: { presence: { key: userId } },
        })

        const check = () => {
            const state = channel.presenceState()
            const onlineUsers = Object.keys(state).filter(id => id !== userId)
            callback(onlineUsers.length > 0)
        }

        channel
            .on('presence' as any, { event: 'sync' }, check)
            .on('presence' as any, { event: 'join' }, check)
            .on('presence' as any, { event: 'leave' }, check)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    channel.track({ userId, onlineAt: new Date().toISOString() }).catch(() => { /* ignore */ })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    },

    /**
     * Mark all incoming messages in a match as read.
     * Validates ownership before writing.
     */
    async markMatchMessagesAsRead(matchId: string, userId: string) {
        if (!matchId || !userId) return
        const supabase = createClient()

        // Ownership validation: caller must be a participant in the match.
        // Done via the `matches` table; if the row doesn't match user1/user2
        // we abort.
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .select('id, user1Id, user2Id')
            .eq('id', matchId)
            .or(`user1Id.eq.${userId},user2Id.eq.${userId}`)
            .maybeSingle()

        if (matchError) {
            console.error('Error validating match ownership:', matchError)
            return
        }
        if (!match) {
            console.warn('markMatchMessagesAsRead: user is not a participant of match', matchId)
            return
        }

        const { error } = await supabase
            .from('messages')
            .update({ readAt: new Date().toISOString(), status: 'read' })
            .eq('matchId', matchId)
            .neq('senderId', userId)
            .is('readAt', null)

        if (error) {
            console.error('Error marking messages as read:', error)
        }
    },

    /**
     * Unread count: how many incoming messages in the match are still unread.
     * The caller must already be a participant in the match.
     */
    async getUnreadCount(matchId: string, userId: string): Promise<number> {
        const supabase = createClient()
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('matchId', matchId)
            .neq('senderId', userId)
            .is('readAt', null)

        if (error) {
            console.error('Error getting unread count:', error)
            return 0
        }
        return count || 0
    },

    /**
     * Subscribe to unread-count changes. We listen only to UPDATEs (a message
     * becoming read) and INSERTs (new incoming messages), avoiding the storm
     * caused by `event: '*'`.
     */
    subscribeToUnreadCount(matchId: string, userId: string, callback: (count: number) => void) {
        const supabase = createClient()
        let debounceTimer: ReturnType<typeof setTimeout> | null = null

        const refresh = () => {
            if (debounceTimer) clearTimeout(debounceTimer)
            debounceTimer = setTimeout(async () => {
                const count = await chatService.getUnreadCount(matchId, userId)
                callback(count)
            }, 250)
        }

        const { cleanup } = subscribeWithReconnect(
            supabase,
            `unread:${matchId}:${userId}`,
            (ch) =>
                ch
                    .on(
                        'postgres_changes' as any,
                        {
                            event: 'INSERT',
                            schema: 'public',
                            table: 'messages',
                            filter: `matchId=eq.${matchId}`,
                        },
                        refresh
                    )
                    .on(
                        'postgres_changes' as any,
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'messages',
                            filter: `matchId=eq.${matchId}`,
                        },
                        refresh
                    ),
        )

        return () => {
            if (debounceTimer) clearTimeout(debounceTimer)
            cleanup()
        }
    },
}
