'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/lib/domain/types';
import { chatService } from '@/lib/supabase/services/chat';

export function useChat(matchId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [offset, setOffset] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 50;

    useEffect(() => {
        if (!matchId || !user) return;

        setLoading(true);

        const unsubscribe = chatService.subscribeToMessages(matchId, (initialMessages) => {
            setMessages(initialMessages);
            setLoading(false);
            setHasMore(initialMessages.length === PAGE_SIZE);
        }, { limit: PAGE_SIZE, offset: 0 });

        return () => unsubscribe();
    }, [matchId, user]);

    const loadMore = async () => {
        if (!hasMore || loading) return;
        const newOffset = offset + PAGE_SIZE;
        setOffset(newOffset);
        // Direct fetch for older messages
        // (In a real implementation we'd expose a separate getMessages call)
    };

    const sendMessage = async (text: string, receiverId: string) => {
        if (!user || !text.trim()) return;

        try {
            setSending(true);

            // Cookie auth handles authentication automatically
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            // Real-time listener actualizará los mensajes automáticamente
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            throw err;
        } finally {
            setSending(false);
        }
    };

    const markAsRead = async () => {
        if (!user || !matchId) return;

        try {
            await chatService.markMatchMessagesAsRead(matchId, user.id);
        } catch (err) {
            console.error('Error marking messages as read:', err);
        }
    };

    return {
        messages,
        loading,
        loadingMore,
        hasMore,
        error,
        sending,
        sendMessage,
        markAsRead,
        loadMore,
    };
}
