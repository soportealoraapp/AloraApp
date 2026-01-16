'use client';

import { useState, useEffect } from 'react';
import { messaging } from '@/lib/firebase/config';
import { getToken, onMessage } from 'firebase/messaging';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function useNotifications() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [token, setToken] = useState<string | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>('default');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!messaging || !user) return;

        try {
            const status = await Notification.requestPermission();
            setPermission(status);

            if (status === 'granted') {
                const fcmToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (fcmToken) {
                    setToken(fcmToken);
                    await registerToken(fcmToken);
                }
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    };

    const registerToken = async (fcmToken: string) => {
        try {
            await fetch('/api/notifications/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: fcmToken })
            });
        } catch (error) {
            console.error('Error registering FCM token:', error);
        }
    };

    useEffect(() => {
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                toast({
                    title: payload.notification?.title || 'Nueva notificación',
                    description: payload.notification?.body,
                });
            });
            return () => unsubscribe();
        }
    }, [toast]);

    return { token, permission, requestPermission };
}
