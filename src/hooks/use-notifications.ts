'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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

const FALLBACK_POLL_MS = 300_000;

export function useNotifications({
    pollIntervalMs = FALLBACK_POLL_MS,
    enabled = true,
}: UseNotificationsOptions = {}): UseNotificationsResult {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const offsetRef = useRef(0);
    const abortRef = useRef<AbortController | null>(null);
    const channelRef = useRef<RealtimeChannel | null>(null);

    const fetchNotifications = useCallback(async (signal?: AbortSignal, reset = true) => {
        try {
            if (reset) {
                offsetRef.current = 0;
                setHasMore(true);
            }
            const offset = reset ? 0 : offsetRef.current;
            const res = await fetch(`/api/notifications?limit=30&offset=${offset}`, {
                cache: 'no-store',
                signal,
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const data = await res.json();
            const fetched = data.notifications ?? [];
            if (reset) {
                setNotifications(fetched);
            } else {
                setNotifications(prev => [...prev, ...fetched]);
            }
            setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
            offsetRef.current = offset + fetched.length;
            setHasMore(fetched.length >= 30);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'fetch failed');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const controller = new AbortController();
        abortRef.current = controller;
        fetchNotifications(controller.signal);

        // Subscribe to real-time notification inserts
        const supabase = createClient();
        const channel = supabase
            .channel('notifications-realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    const n = payload.new as any;
                    const notification: AppNotification = {
                        id: n.id,
                        type: n.type,
                        title: n.title,
                        body: n.body,
                        data: n.data,
                        readAt: n.readAt,
                        createdAt: n.createdAt,
                    };
                    setNotifications(prev => [notification, ...prev]);
                    if (!n.readAt) setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();
        channelRef.current = channel;

        // Fallback polling (5 min) to catch any missed events
        const interval = setInterval(() => fetchNotifications(), pollIntervalMs);
        return () => {
            controller.abort();
            clearInterval(interval);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [enabled, pollIntervalMs, fetchNotifications]);

    const markRead = useCallback(async (ids: string[]) => {
        if (ids.length === 0) return;
        
        // Capture current state for rollback
        let prevNotifications: AppNotification[] = [];
        let prevUnreadCount = 0;
        
        // Optimistic update using functional state updates to avoid stale closures
        setNotifications(prev => {
            prevNotifications = prev;
            return prev.map(n => ids.includes(n.id) && !n.readAt ? { ...n, readAt: new Date().toISOString() } : n);
        });
        setUnreadCount(prev => {
            prevUnreadCount = prev;
            return Math.max(0, prev - ids.length);
        });
        
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            if (!res.ok) throw new Error('Failed to mark as read');
        } catch (err) {
            // Rollback on failure
            setNotifications(prevNotifications);
            setUnreadCount(prevUnreadCount);
            console.warn('[use-notifications] markRead failed:', err);
        }
    }, []);

    const markAllRead = useCallback(async () => {
        // Capture current state for rollback
        let prevNotifications: AppNotification[] = [];
        let prevUnreadCount = 0;
        
        // Optimistic update using functional state updates to avoid stale closures
        setNotifications(prev => {
            prevNotifications = prev;
            return prev.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() });
        });
        setUnreadCount(prev => {
            prevUnreadCount = prev;
            return 0;
        });
        
        try {
            const res = await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
            if (!res.ok) throw new Error('Failed to mark all as read');
        } catch (err) {
            // Rollback on failure
            setNotifications(prevNotifications);
            setUnreadCount(prevUnreadCount);
            console.warn('[use-notifications] markAllRead failed:', err);
        }
    }, []);

    const pendingDeletesRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const deleteNotification = useCallback(async (id: string) => {
        // Capture current state for rollback
        let prevNotifications: AppNotification[] = [];
        
        // Optimistic update — remove from visible list immediately
        setNotifications(prev => {
            prevNotifications = prev;
            return prev.filter(n => n.id !== id);
        });
        
        // Delay the actual API DELETE by 5 seconds to allow undo
        const timeout = setTimeout(async () => {
            pendingDeletesRef.current.delete(id);
            try {
                const res = await fetch(`/api/notifications?id=${id}`, {
                    method: 'DELETE',
                });
                if (!res.ok) throw new Error('Failed to delete notification');
            } catch (err) {
                // Rollback on failure — re-add the notification
                setNotifications(prev => {
                    const restored = prevNotifications.find(n => n.id === id);
                    if (restored && !prev.find(n => n.id === id)) {
                        return [restored, ...prev];
                    }
                    return prev;
                });
                console.warn('[use-notifications] deleteNotification failed:', err);
            }
        }, 5000);

        pendingDeletesRef.current.set(id, timeout);
    }, []);

    const undoDelete = useCallback((id: string) => {
        const timeout = pendingDeletesRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            pendingDeletesRef.current.delete(id);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        await fetchNotifications(undefined, false);
    }, [loadingMore, hasMore, fetchNotifications]);

    return {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        error,
        refresh: () => fetchNotifications(undefined, true),
        loadMore,
        markRead,
        markAllRead,
        deleteNotification,
        undoDelete,
    };
}
