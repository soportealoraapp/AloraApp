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
        setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, readAt: new Date().toISOString() } : n));
        setUnreadCount(prev => Math.max(0, prev - ids.filter(id => notifications.find(n => n.id === id && !n.readAt)).length));
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
        } catch (err) {
            console.warn('[use-notifications] markRead failed:', err);
        }
    }, [notifications]);

    const markAllRead = useCallback(async () => {
        setNotifications(prev => prev.map(n => n.readAt ? n : { ...n, readAt: new Date().toISOString() }));
        setUnreadCount(0);
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ markAll: true }),
            });
        } catch (err) {
            console.warn('[use-notifications] markAllRead failed:', err);
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
    };
}
