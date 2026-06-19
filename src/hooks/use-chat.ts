'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/lib/domain/types';
import { chatService } from '@/lib/supabase/services/chat';
import { addToQueue, processQueue } from '@/lib/offline-queue';

interface TypingUser {
    userId: string;
    timestamp: number;
}

export function useChat(matchId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [isPartnerOnline, setIsPartnerOnline] = useState(false);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const mountedRef = useRef(true);
    const PAGE_SIZE = 50;

    useEffect(() => {
        return () => { mountedRef.current = false; };
    }, []);

    // Subscribe to messages via realtime
    useEffect(() => {
        if (!matchId || !user) return;

        setLoading(true);
        setMessages([]);

        const unsubscribeMessages = chatService.subscribeToMessages(matchId, (initialMessages) => {
            if (!mountedRef.current) return;
            setMessages(initialMessages);
            setLoading(false);
            setHasMore(initialMessages.length === PAGE_SIZE);
        }, { limit: PAGE_SIZE, offset: 0 });

        return () => {
            unsubscribeMessages();
        };
    }, [matchId, user]);

    // Subscribe to partner presence
    useEffect(() => {
        if (!matchId || !user?.id) return;

        const unsubscribePresence = chatService.subscribeToPresence(
            matchId,
            user.id,
            (online) => { if (mountedRef.current) setIsPartnerOnline(online); }
        );

        return () => unsubscribePresence();
    }, [matchId, user?.id]);

    // Subscribe to partner typing indicator
    useEffect(() => {
        if (!matchId || !user?.id) return;

        const unsubscribeTyping = chatService.subscribeToTyping(
            matchId,
            user.id,
            (typingUserIds) => {
                if (!mountedRef.current) return;
                const isPartnerTyping = typingUserIds.length > 0;
                setPartnerTyping(isPartnerTyping);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                if (isPartnerTyping) {
                    // Auto-clear after 3s of no signal
                    typingTimeoutRef.current = setTimeout(() => {
                        if (mountedRef.current) setPartnerTyping(false);
                    }, 3000);
                }
            }
        );

        return () => {
            unsubscribeTyping();
            chatService.closeTypingChannel(matchId);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [matchId, user?.id]);

    // Subscribe to unread count
    useEffect(() => {
        if (!matchId || !user?.id) return;

        const unsubscribeUnread = chatService.subscribeToUnreadCount(
            matchId,
            user.id,
            (count) => { if (mountedRef.current) setUnreadCount(count); }
        );

        return () => unsubscribeUnread();
    }, [matchId, user?.id]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !matchId) return;
        setLoadingMore(true);

        try {
            // The endpoint returns messages oldest -> newest. We use the
            // last message's id as a cursor for the next page (stable across
            // inserts). For the very first page we use offset=0.
            const firstId = messages[0]?.id;
            const url = firstId && !firstId.startsWith('optimistic_')
                ? `/api/chat/${matchId}?before=${encodeURIComponent(firstId)}&limit=${PAGE_SIZE}`
                : `/api/chat/${matchId}?offset=${offset}&limit=${PAGE_SIZE}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to load more messages');

            const data = await response.json();
            const olderMessages: Message[] = Array.isArray(data) ? data : (data.messages ?? []);

            if (olderMessages.length < PAGE_SIZE) setHasMore(false);

            // olderMessages is already oldest -> newest from the server.
            setMessages(prev => deduplicate([...olderMessages, ...prev]));
            setOffset(prev => prev + PAGE_SIZE);
        } catch (err) {
            console.error('Error loading more messages:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [matchId, hasMore, loadingMore, offset, messages]);

    const sendMessage = useCallback(async (text: string, receiverId: string) => {
        if (!user || !text.trim() || !matchId) return;

        // Optimistic message
        const optimisticId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const optimisticMessage: Message = {
            id: optimisticId,
            matchId,
            senderId: user.id,
            content: text.trim(),
            createdAt: new Date(),
            type: 'text',
            status: 'pending',
        };

        setMessages(prev => [...prev, optimisticMessage]);
        setSending(true);

        try {
            // If offline, queue for later
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                addToQueue('message', {
                    matchId,
                    receiverId,
                    text: text.trim(),
                    type: 'text',
                });
                // Keep optimistic message visible with pending status
                setMessages(prev => prev.map(m =>
                    m.id === optimisticId ? { ...m, status: 'pending' as const } : m
                ));
                return;
            }

            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    receiverId,
                    text: text.trim(),
                    type: 'text',
                    clientMessageId: optimisticId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const error: any = new Error(errorData.message || 'Error al enviar mensaje');
                error.code = errorData.error;
                throw error;
            }

            const data = await response.json();
            setMessages(prev => deduplicate([
                ...prev.filter(m => m.id !== optimisticId),
                { ...data, createdAt: new Date(data.created_at || data.createdAt) }
            ]));

        } catch (err) {
            // Queue for retry when offline
            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                addToQueue('message', {
                    matchId,
                    receiverId,
                    text: text.trim(),
                    type: 'text',
                });
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
                return;
            }

            // Mark optimistic message as failed
            setMessages(prev =>
                prev.map(m =>
                    m.id === optimisticId
                        ? { ...m, status: 'failed' as const }
                        : m
                )
            );
            setError(err instanceof Error ? err.message : 'Error desconocido');
            throw err;
        } finally {
            setSending(false);
        }
    }, [user, matchId]);

    const emitTyping = useCallback(async () => {
        if (!user?.id || !matchId) return;
        try {
            await chatService.emitTyping(matchId, user.id);
        } catch (err) {
            // Silently fail for typing indicators
        }
    }, [user?.id, matchId]);

    const markAsRead = useCallback(async () => {
        if (!user || !matchId) return;
        try {
            await chatService.markMatchMessagesAsRead(matchId, user.id);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    }, [user, matchId]);

    return {
        messages,
        setMessages,
        loading,
        loadingMore,
        hasMore,
        error,
        sending,
        sendMessage,
        emitTyping,
        markAsRead,
        loadMore,
        isPartnerOnline,
        partnerTyping,
        unreadCount,
    };
}

function deduplicate(messages: Message[]): Message[] {
    const seen = new Set<string>();
    return messages.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
    });
}
