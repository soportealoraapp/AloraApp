'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent as clientTrackEvent } from '@/lib/tracking/client';
import { AnalyticsEvents } from '@/lib/tracking/events';

export { AnalyticsEvents };

export function useAnalytics() {
    const { user } = useAuth();

    const track = useCallback((event: string, metadata?: Record<string, any>) => {
        clientTrackEvent(event, { ...metadata, userId: user?.id });
    }, [user?.id]);

    return { track };
}

/**
 * Track a server-side analytics event.
 * Used in server actions and API routes.
 */
export async function trackServerEvent(
    userId: string,
    event: string,
    metadata?: Record<string, any>,
) {
    try {
        const { trackEvent } = await import('@/server/services/analytics');
        await trackEvent(userId, event as any, metadata);
    } catch {
        // Silently fail
    }
}
