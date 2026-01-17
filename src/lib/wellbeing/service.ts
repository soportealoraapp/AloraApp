import { prisma } from "@/lib/prisma";
import { logAuditAction } from "@/server/actions/audit";

export const wellbeingService = {
    getStats: async (userId: string) => {
        // Mock calculation or real DB query
        // For v3.x, we count events
        const events = await prisma.wellbeingEvent.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Simple heuristic for "Social Battery" based on fatigue events
        const fatigueCount = events.filter((e: { type: string }) => e.type === 'fatigue_detected').length;
        const batteryLevel = Math.max(0, 100 - (fatigueCount * 20));

        return {
            batteryLevel,
            recentEvents: events
        };
    },

    logEvent: async (userId: string, type: 'fatigue_detected' | 'ghosting_intervention' | 'burnout_warning', severity: 'low' | 'medium' | 'high') => {
        const event = await prisma.wellbeingEvent.create({
            data: {
                userId,
                type,
                severity
            }
        });

        // TRUST & SAFETY: Check for rapid succession of high-severity events (Burnout Risk)
        if (severity === 'high') {
            const recentHighEvents = await prisma.wellbeingEvent.count({
                where: {
                    userId,
                    severity: 'high',
                    createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // last 24h
                }
            });

            if (recentHighEvents >= 3) {
                await logAuditAction(userId, 'RISK_FLAG_BURNOUT', { count: recentHighEvents, triggerEventId: event.id });
            }
        }

        await logAuditAction(userId, 'WELLBEING_EVENT', { type, severity, eventId: event.id });
        return event;
    }
};
