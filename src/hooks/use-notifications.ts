'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    body: string;
    data: unknown;
    readAt: string | null;
    createdAt: string;
}

interface UseNotificationsOptions {
    pollIntervalMs?: number;
    enabled?: boolean;
}

interface UseNotificationsResult {
    notifications: AppNotification[];
    unreadCount: number;
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    loadMore: () => Promise<void>;
    markRead: (ids: string[]) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    undoDelete: (id: string) => void;
}

export function useNotifications({
    pollIntervalMs = 300_000,
    enabled = true,
}: UseNotificationsOptions = {}): UseNotificationsResult {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const {
        data,
        isLoading: loading,
        error: queryError,
        refetch,
    } = useQuery({
        queryKey: ['notifications'],
        queryFn: async ({ signal }) => {
            const res = await fetch('/api/notifications?limit=30&offset=0', {
                cache: 'no-store',
                signal,
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = await res.json();
            const fetched = json.notifications ?? [];
            return {
                notifications: fetched as AppNotification[],
                unreadCount: typeof json.unreadCount === 'number' ? json.unreadCount : 0,
            };
        },
        enabled,
        staleTime: 30_000,
        refetchInterval: pollIntervalMs,
    });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;
    const error = queryError instanceof Error ? queryError.message : queryError ? 'fetch failed' : null;

    // Realtime subscription
    useEffect(() => {
        if (!enabled) return;

        const supabase = createClient();
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['notifications'] });
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[use-notifications] Realtime channel error, relying on poll fallback');
                }
            });
        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [enabled, queryClient]);

    const markRead = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error('Failed to mark as read');
        } catch (err) {
            console.warn('[use-notifications] markRead failed:', err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
        } catch (err) {
            console.warn('[use-notifications] markAllRead failed:', err);
        }
    }, []);

    const deleteNotification = useCallback(async (id: string) => {
        const timeout = setTimeout(async () => {
            pendingDeletesRef.current.delete(id);
            try {
                const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error('Failed to delete notification');
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
            } catch (err) {
                queryClient.invalidateQueries({ queryKey: ['notifications'] });
                console.warn('[use-notifications] deleteNotification failed:', err);
            }
        }, 5000);

        pendingDeletesRef.current.set(id, timeout);
    }, [queryClient]);

    const undoDelete = useCallback((id: string) => {
        const timeout = pendingDeletesRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            pendingDeletesRef.current.delete(id);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        loadingMore: false,
        hasMore: false,
        error,
        refresh: async () => { await refetch(); },
        loadMore: async () => { },
        markRead,
        markAllRead,
        deleteNotification,
        undoDelete,
    };
}
