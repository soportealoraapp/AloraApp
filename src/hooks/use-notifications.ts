'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

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
    error: string | null;
    refresh: () => Promise<void>;
    markRead: (ids: string[]) => Promise<void>;
    markAllRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
}

const DEFAULT_POLL_MS = 30_000;

export function useNotifications({
    pollIntervalMs = DEFAULT_POLL_MS,
    enabled = true,
}: UseNotificationsOptions = {}): UseNotificationsResult {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const fetchNotifications = useCallback(async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/notifications?limit=30', {
                cache: 'no-store',
                signal,
            });
            if (!res.ok) throw new Error(`status ${res.status}`);
            const data = await res.json();
            setNotifications(data.notifications ?? []);
            setUnreadCount(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof DOMException && err.name === 'AbortError') return;
            setError(err instanceof Error ? err.message : 'fetch failed');
        } finally {
            setLoading(false);
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
        const interval = setInterval(() => fetchNotifications(), pollIntervalMs);
        return () => {
            controller.abort();
            clearInterval(interval);
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

    const deleteNotification = useCallback(async (id: string) => {
        // Capture current state for rollback
        let prevNotifications: AppNotification[] = [];
        
        // Optimistic update using functional state update to avoid stale closures
        setNotifications(prev => {
            prevNotifications = prev;
            return prev.filter(n => n.id !== id);
        });
        
        try {
            const res = await fetch(`/api/notifications?id=${id}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to delete notification');
        } catch (err) {
            // Rollback on failure
            setNotifications(prevNotifications);
            console.warn('[use-notifications] deleteNotification failed:', err);
        }
    }, []);

    return {
        notifications,
        unreadCount,
        loading,
        error,
        refresh: () => fetchNotifications(),
        markRead,
        markAllRead,
        deleteNotification,
    };
}
