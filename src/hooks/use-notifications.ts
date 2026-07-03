'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithReconnect } from '@/lib/supabase/realtime-reconnect';
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
    pageSize?: number;
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
    pollIntervalMs = 60_000,
    enabled = true,
    pageSize = 30,
}: UseNotificationsOptions = {}): UseNotificationsResult {
    const queryClient = useQueryClient();
    const channelRef = useRef<RealtimeChannel | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const loadingMoreRef = useRef(false);

    const {
        data,
        isLoading: loading,
        error: queryError,
        refetch,
    } = useQuery({
        queryKey: ['notifications'],
        queryFn: async ({ signal }) => {
            const res = await fetch(`/api/notifications?limit=${pageSize}&offset=0`, {
                cache: 'no-store',
                signal,
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = await res.json();
            const fetched = json.notifications ?? [];
            return {
                notifications: fetched as AppNotification[],
                unreadCount: typeof json.unreadCount === 'number' ? json.unreadCount : 0,
                hasMore: json.hasMore === true,
            };
        },
        enabled,
        staleTime: 30_000,
        refetchInterval: pollIntervalMs,
    });

    const notifications = data?.notifications ?? [];
    const unreadCount = data?.unreadCount ?? 0;
    const hasMore = data?.hasMore ?? false;
    const error = queryError instanceof Error ? queryError.message : queryError ? 'fetch failed' : null;

    // Realtime subscription with reconnection
    useEffect(() => {
        if (!enabled) return;

        const supabase = createClient();
        const { channel, cleanup } = subscribeWithReconnect(
            supabase,
            'notifications-realtime',
            (ch) =>
                ch
                    .on(
                        'postgres_changes',
                        { event: 'INSERT', schema: 'public', table: 'notifications' },
                        () => {
                            queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        }
                    )
                    .on(
                        'postgres_changes',
                        { event: 'UPDATE', schema: 'public', table: 'notifications' },
                        () => {
                            queryClient.invalidateQueries({ queryKey: ['notifications'] });
                        }
                    ),
            { onStatusChange: (status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[use-notifications] Realtime channel error, relying on poll fallback');
                }
            }},
        );
        channelRef.current = channel;
        cleanupRef.current = cleanup;

        return () => {
            cleanupRef.current?.();
            channelRef.current = null;
            cleanupRef.current = null;
        };
    }, [enabled, queryClient]);

    const markRead = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;
        try {
            // Optimistic update: immediately decrement unreadCount in cache
            queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return old;
                return { ...old, unreadCount: Math.max(0, old.unreadCount - ids.length) };
            });
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error('Failed to mark as read');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (err) {
            // Rollback: refetch to restore correct state
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            console.warn('[use-notifications] markRead failed:', err);
        }
    }, [queryClient]);

    const markAllRead = useCallback(async () => {
        try {
            // Optimistic update: set unreadCount to 0 immediately
            queryClient.setQueryData(['notifications'], (old: any) => {
                if (!old) return old;
                return { ...old, unreadCount: 0 };
            });
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        } catch (err) {
            // Rollback: refetch to restore correct state
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            console.warn('[use-notifications] markAllRead failed:', err);
        }
    }, [queryClient]);

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

    const loadMore = useCallback(async () => {
        if (loadingMoreRef.current || !hasMore) return;
        loadingMoreRef.current = true;
        try {
            const currentOffset = notifications.length;
            const res = await fetch(`/api/notifications?limit=${pageSize}&offset=${currentOffset}`, {
                cache: 'no-store',
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const json = await res.json();
            const newItems = (json.notifications ?? []) as AppNotification[];
            if (newItems.length > 0) {
                queryClient.setQueryData(['notifications'], (old: any) => {
                    if (!old) return old;
                    return {
                        ...old,
                        notifications: [...old.notifications, ...newItems],
                        hasMore: json.hasMore === true,
                    };
                });
            } else {
                queryClient.setQueryData(['notifications'], (old: any) => {
                    if (!old) return old;
                    return { ...old, hasMore: false };
                });
            }
        } catch (err) {
            console.warn('[use-notifications] loadMore failed:', err);
        } finally {
            loadingMoreRef.current = false;
        }
    }, [hasMore, notifications.length, pageSize, queryClient]);

    return {
        notifications,
        unreadCount,
        loading,
        loadingMore: loadingMoreRef.current,
        hasMore,
        error,
        refresh: async () => { await refetch(); },
        loadMore,
        markRead,
        markAllRead,
        deleteNotification,
        undoDelete,
    };
}
