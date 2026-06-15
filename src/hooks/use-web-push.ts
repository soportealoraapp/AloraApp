'use client';

import { useEffect, useRef } from 'react';
import { isNativePlatform } from '@/lib/mobile';

/**
 * Register web push notifications (Firebase Cloud Messaging for PWA).
 * Only runs on web — native uses @capacitor/push-notifications.
 * Skips if permission already granted and token already registered.
 */
export function useWebPush(userId: string | null) {
    const registeredRef = useRef(false);

    useEffect(() => {
        if (!userId || isNativePlatform() || registeredRef.current) return;
        if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) return;

        // Check if already have permission and token
        if (Notification.permission === 'granted') {
            registerToken(userId);
            return;
        }

        // Auto-request permission on first visit (non-blocking)
        if (Notification.permission === 'default') {
            // Don't auto-request — wait for user action
            return;
        }
    }, [userId]);
}

async function registerToken(userId: string) {
    try {
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { initializeApp, getApps } = await import('firebase/app');

        // Fetch Firebase config from our API
        const res = await fetch('/api/push-config');
        if (!res.ok) return;
        const config = await res.json();

        // Initialize Firebase (reuse existing app if available)
        const app = getApps().length > 0
            ? getApps()[0]
            : initializeApp(config);

        const messaging = getMessaging(app);

        // Get FCM token with service worker
        const token = await getToken(messaging, {
            vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || undefined,
            serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });

        if (token) {
            await fetch('/api/notifications/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, platform: 'web' }),
            });
        }
    } catch (error) {
        console.warn('[web-push] Registration failed:', error);
    }
}

/**
 * Request notification permission and register token.
 * Call this from UI (button click).
 */
export async function requestWebPushPermission(userId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (isNativePlatform()) return false;

    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            await registerToken(userId);
            return true;
        }
    } catch (error) {
        console.warn('[web-push] Permission request failed:', error);
    }
    return false;
}
