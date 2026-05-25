import { createClient } from '../client'
import { Message } from '@/lib/domain/types'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type MessageCallback = (messages: Message[]) => void
type NewMessageCallback = (message: Message) => void
type PresenceCallback = (online: boolean) => void

const messageCache = new Map<string, { messages: Message[]; offset: number; hasMore: boolean }>()

function deduplicate(messages: Message[]): Message[] {
    const seen = new Set<string>()
    return messages.filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
    })
}

export const chatService = {
    subscribeToMessages(
        matchId: string,
        callback: MessageCallback,
        options?: { limit?: number; offset?: number }
    ) {
        const supabase = createClient()
        const limit = options?.limit || 50
        const cacheKey = matchId

        // Initial fetch
        let query = supabase
            .from('messages')
            .select('*')
            .eq('match_id', matchId)
            .order('created_at', { ascending: false })

        if (options?.offset) {
            query = query.range(options.offset, options.offset + limit - 1)
        } else {
            query = query.limit(limit)
        }

        let initialFetched = false
        let knownIds = new Set<string>()

        query.then(({ data, error }) => {
            if (error) {
                console.error('Error fetching messages:', error)
                return
            }
            if (data) {
                const messages = (data as any as Message[]).reverse()
                knownIds = new Set(messages.map(m => m.id))
                messageCache.set(cacheKey, { messages, offset: 0, hasMore: data.length === limit })
                initialFetched = true
                callback(messages)
            }
        })

        // Realtime subscription with deduplication
        const channel = supabase
            .channel(`match:${matchId}`)
            .on(
                'postgres_changes' as any,
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
                    const newMsg = payload.new as any
                    if (!newMsg || !newMsg.id) return

                    // Deduplication: skip if we already have this message
                    if (knownIds.has(newMsg.id)) return
                    knownIds.add(newMsg.id)

                    const cached = messageCache.get(cacheKey)
                    const message: Message = {
                        id: newMsg.id,
                        matchId: newMsg.match_id,
                        senderId: newMsg.sender_id,
                        content: newMsg.content,
                        createdAt: newMsg.created_at,
                        readAt: newMsg.read_at || undefined,
                        type: newMsg.type || 'text',
                        status: newMsg.status || 'sent',
                    }

                    if (cached) {
                        cached.messages = deduplicate([...cached.messages, message])
                        callback(cached.messages)
                    } else {
                        callback([message])
                    }
                }
            )
            .subscribe((status) => {
                if (status !== 'SUBSCRIBED') {
                    console.warn('Realtime subscription status:', status)
                }
            })

        return () => {
            supabase.removeChannel(channel)
            messageCache.delete(cacheKey)
        }
    },

    subscribeToNewMessage(matchId: string, callback: NewMessageCallback) {
        const supabase = createClient()
        const seenIds = new Set<string>()

        const channel = supabase
            .channel(`match:new:${matchId}`)
            .on(
                'postgres_changes' as any,
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                (payload: RealtimePostgresChangesPayload<{ [key: string]: any }>) => {
                    const newMsg = payload.new as any
                    if (!newMsg || !newMsg.id || seenIds.has(newMsg.id)) return
                    seenIds.add(newMsg.id)

                    callback({
                        id: newMsg.id,
                        matchId: newMsg.match_id,
                        senderId: newMsg.sender_id,
                        content: newMsg.content,
                        createdAt: newMsg.created_at,
                        readAt: newMsg.read_at || undefined,
                        type: newMsg.type || 'text',
                        status: newMsg.status || 'sent',
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },

    subscribeToTyping(matchId: string, userId: string, callback: (typingUserId: string) => void) {
        const supabase = createClient()
        const channel = supabase
            .channel(`typing:${matchId}`)
            .on(
                'presence' as any,
                { event: 'sync' },
                () => {
                    const state = channel.presenceState()
                    const typingUsers = Object.keys(state).filter(id => id !== userId)
                    typingUsers.forEach(id => callback(id))
                }
            )
            .on(
                'presence' as any,
                { event: 'join' },
                ({ key }) => {
                    if (key !== userId) callback(key)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },

    async emitTyping(matchId: string, userId: string) {
        const supabase = createClient()
        const channel = supabase.channel(`typing:${matchId}`)
        await channel.subscribe()
        await channel.track({ userId, typingAt: new Date().toISOString() })
        setTimeout(() => {
            supabase.removeChannel(channel)
        }, 3000)
    },

    subscribeToPresence(matchId: string, userId: string, callback: PresenceCallback) {
        const supabase = createClient()
        const channel = supabase
            .channel(`presence:${matchId}`)
            .on(
                'presence' as any,
                { event: 'sync' },
                () => {
                    const state = channel.presenceState()
                    const onlineUsers = Object.keys(state).filter(id => id !== userId)
                    callback(onlineUsers.length > 0)
                }
            )
            .subscribe(async () => {
                await channel.track({ userId, onlineAt: new Date().toISOString() })
            })

        return () => {
            supabase.removeChannel(channel)
        }
    },

    async markMatchMessagesAsRead(matchId: string, userId: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString(), status: 'read' })
            .eq('match_id', matchId)
            .neq('sender_id', userId)
            .is('read_at', null)

        if (error) {
            console.error('Error marking messages as read:', error)
        }
    },

    async getUnreadCount(matchId: string, userId: string): Promise<number> {
        const supabase = createClient()
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', matchId)
            .neq('sender_id', userId)
            .is('read_at', null)

        if (error) {
            console.error('Error getting unread count:', error)
            return 0
        }
        return count || 0
    },

    subscribeToUnreadCount(matchId: string, userId: string, callback: (count: number) => void) {
        const supabase = createClient()
        const channel = supabase
            .channel(`unread:${matchId}:${userId}`)
            .on(
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `match_id=eq.${matchId}`,
                },
                async () => {
                    const count = await this.getUnreadCount(matchId, userId)
                    callback(count)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    },
}
