'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/lib/domain/types';
import { chatService } from '@/lib/supabase/services/chat';

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
    const PAGE_SIZE = 50;

    // Subscribe to messages via realtime
    useEffect(() => {
        if (!matchId || !user) return;

        setLoading(true);
        setMessages([]);

        const unsubscribeMessages = chatService.subscribeToMessages(matchId, (initialMessages) => {
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
            (online) => setIsPartnerOnline(online)
        );

        return () => unsubscribePresence();
    }, [matchId, user?.id]);

    // Subscribe to partner typing indicator
    useEffect(() => {
        if (!matchId || !user?.id) return;

        const unsubscribeTyping = chatService.subscribeToTyping(
            matchId,
            user.id,
            (typingUserId) => {
                setPartnerTyping(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setPartnerTyping(false), 3000);
            }
        );

        return () => {
            unsubscribeTyping();
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [matchId, user?.id]);

    // Subscribe to unread count
    useEffect(() => {
        if (!matchId || !user?.id) return;

        const unsubscribeUnread = chatService.subscribeToUnreadCount(
            matchId,
            user.id,
            (count) => setUnreadCount(count)
        );

        return () => unsubscribeUnread();
    }, [matchId, user?.id]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || !matchId) return;
        setLoadingMore(true);

        try {
            const response = await fetch(`/api/chat/${matchId}?offset=${offset + PAGE_SIZE}&limit=${PAGE_SIZE}`);
            if (!response.ok) throw new Error('Failed to load more messages');

            const olderMessages = await response.json();
            if (olderMessages.length < PAGE_SIZE) setHasMore(false);

            setMessages(prev => deduplicate([...olderMessages.reverse(), ...prev]));
            setOffset(prev => prev + PAGE_SIZE);
        } catch (err) {
            console.error('Error loading more messages:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [matchId, hasMore, loadingMore, offset]);

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
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    receiverId,
                    text: text.trim(),
                    type: 'text',
                }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar mensaje');
            }

            // The realtime subscription will add the confirmed message.
            // Remove the optimistic one to avoid duplicates.
            const data = await response.json();
            setMessages(prev => prev.filter(m => m.id !== optimisticId));

        } catch (err) {
            // Mark optimistic message as failed
            setMessages(prev =>
                prev.map(m =>
                    m.id === optimisticId
                        ? { ...m, status: 'flagged' as const }
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
