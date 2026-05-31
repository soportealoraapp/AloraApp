'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/tracking/client';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    useEffect(() => {
        if (user?.id) {
            // Track daily active on app load
            trackEvent('daily_active', { userId: user.id });
        }
    }, [user?.id]);

    return <>{children}</>;
}
