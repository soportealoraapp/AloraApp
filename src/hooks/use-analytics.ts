'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type AnalyticsEventType =
    | 'signup'
    | 'onboarding_complete'
    | 'first_match'
    | 'first_message'
    | 'first_reply'
    | 'daily_active'
    | 'weekly_active'
    | 'monthly_active';

let sessionId: string | null = null;
if (typeof window !== 'undefined') {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
}

export function useAnalytics() {
    const { user } = useAuth();

    const track = useCallback(async (event: AnalyticsEventType, metadata?: Record<string, any>) => {
        if (!user?.id) return;
        try {
            await fetch('/api/analytics/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event, metadata, sessionId }),
            });
        } catch {
            // Silently fail analytics
        }
    }, [user?.id]);

    return { track };
}

/**
 * Track a server-side analytics event.
 * Used in server actions and API routes.
 */
export async function trackServerEvent(
    userId: string,
    event: AnalyticsEventType,
    metadata?: Record<string, any>,
) {
    try {
        const { trackEvent } = await import('@/server/services/analytics');
        await trackEvent(userId, event, metadata);
    } catch {
        // Silently fail
    }
}
