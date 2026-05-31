'use client';

const eventCache: Array<{ event: string; metadata?: Record<string, any> }> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let sessionId: string | null = null;

if (typeof window !== 'undefined') {
    sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        sessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('analytics_session_id', sessionId);
    }
}

async function flush() {
    if (eventCache.length === 0) return;
    const events = [...eventCache];
    eventCache.length = 0;

    try {
        await fetch('/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ events, sessionId }),
        });
    } catch {
        // Silently fail — events are lost but app continues
    }
}

function debouncedFlush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flush, 2000);
}

export function trackEvent(event: string, metadata?: Record<string, any>) {
    try {
        eventCache.push({ event, metadata: { ...metadata, timestamp: new Date().toISOString() } });
        debouncedFlush();
    } catch {
        // Silently fail
    }
}

export function trackPageView(page: string) {
    trackEvent('page_view', { page });
}

export function trackEngagement(action: string, metadata?: Record<string, any>) {
    trackEvent(action, metadata);
}

// Flush on page unload
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (eventCache.length > 0) {
            navigator.sendBeacon('/api/analytics/track', JSON.stringify({
                events: eventCache,
                sessionId
            }));
        }
    });
}
