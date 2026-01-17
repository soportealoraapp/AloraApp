'use client';

import { logAuditAction } from "@/server/actions/audit";

/**
 * Lightweight client-side tracking wrapper.
 * Calls the server action to persist critical engagement events.
 */
export async function trackEvent(
    action: string,
    details?: Record<string, any>
) {
    try {
        // We can add client-side info here (like userAgent if needed, or timestamp)
        // For now, we rely on the server action to handle auth context if possible, 
        // but since audit action takes userId, we probably need passing it or identifying session server-side.
        // However, logAuditAction signature is (userId, action, details).
        // Since this is client-side, we might not always have userId readily available in props.
        // If we can't get userId, we can't log to DB easily without session context.
        // OPTION 1: Require userId.
        // OPTION 2: Make logAuditAction infer user from session (better security).

        // For Alora v3.x current structure, let's assume components pass userId or we fail gracefully.
        const userId = details?.userId;
        if (userId) {
            await logAuditAction(userId, action, details);
        }
    } catch (e) {
        // Silently fail on tracking errors to not disrupt UX
        console.error("Tracking error:", e);
    }
}
