'use client';

import { logAuditAction } from "@/server/actions/audit";

const eventCache: string[] = [];
let flushTimer: NodeJS.Timeout | null = null;

function flush() {
    if (eventCache.length === 0) return;
    const events = [...eventCache];
    eventCache.length = 0;
    // Could send to analytics endpoint here
    console.debug('[Analytics]', events);
}

function debouncedFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 2000);
}

export async function trackEvent(
    action: string,
    details?: Record<string, any>
) {
    try {
        eventCache.push(action);
        debouncedFlush();

        const userId = details?.userId;
        if (userId) {
            await logAuditAction(userId, action, details).catch(() => {});
        }
    } catch (e) {
        // Silently fail
    }
}

export function trackPageView(page: string, userId?: string) {
    trackEvent('page_view', { page, userId, timestamp: new Date().toISOString() });
}

export function trackEngagement(action: string, metadata?: Record<string, any>) {
    trackEvent(action, { ...metadata, timestamp: new Date().toISOString() });
}
