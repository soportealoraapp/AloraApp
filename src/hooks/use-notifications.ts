'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getNotifications, markNotificationAsRead } from '@/server/actions/notifications';

// We import the type from Prisma client if we want strict typing or define a local interface
interface Notification {
    id: string;
    type: string;
    title: string;
    body: string;
    readAt: Date | null;
    createdAt: Date;
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const refresh = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getNotifications(user.id);
        setNotifications(data);
        setLoading(false);
    };

    useEffect(() => {
        refresh();
    }, [user]);

    const markAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, readAt: new Date() } : n));
    };

    const unreadCount = notifications.filter(n => !n.readAt).length;

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        refresh
    };
}
