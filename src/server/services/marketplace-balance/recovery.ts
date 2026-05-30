import { prisma } from '@/lib/prisma';
import { getRegionalHealth } from './engine';

export interface RecoveryAlert {
    type: 'female_decline' | 'conversation_drop' | 'date_conversion_drop';
    severity: 'high' | 'medium' | 'low';
    message: string;
    metric: string;
    current: number;
    previous: number;
    change: number;
}

/**
 * Detect marketplace recovery needs.
 */
export async function detectRecoveryNeeds(): Promise<RecoveryAlert[]> {
    const alerts: RecoveryAlert[] = [];
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // 1. Female activity decline
    const [thisWeekWomen, lastWeekWomen] = await Promise.all([
        prisma.profile.count({
            where: {
                gender: { in: ['woman', 'female'] },
                lastActiveAt: { gte: oneWeekAgo }
            }
        }),
        prisma.profile.findMany({
            where: {
                gender: { in: ['woman', 'female'] },
                lastActiveAt: { gte: twoWeeksAgo, lt: oneWeekAgo }
            },
            select: { id: true }
        }).then(r => r.length),
    ]);

    if (lastWeekWomen > 0) {
        const femaleDecline = ((lastWeekWomen - thisWeekWomen) / lastWeekWomen) * 100;
        if (femaleDecline > 20) {
            alerts.push({
                type: 'female_decline',
                severity: 'high',
                message: `Actividad femenina disminuyó ${femaleDecline.toFixed(0)}% esta semana`,
                metric: 'Mujeres activas',
                current: thisWeekWomen,
                previous: lastWeekWomen,
                change: -femaleDecline,
            });
        } else if (femaleDecline > 10) {
            alerts.push({
                type: 'female_decline',
                severity: 'medium',
                message: `Ligera disminución en actividad femenina: ${femaleDecline.toFixed(0)}%`,
                metric: 'Mujeres activas',
                current: thisWeekWomen,
                previous: lastWeekWomen,
                change: -femaleDecline,
            });
        }
    }

    // 2. Conversation rate decline
    const [thisWeekConversations, lastWeekConversations] = await Promise.all([
        prisma.match.count({
            where: {
                messages: { some: { createdAt: { gte: oneWeekAgo } } }
            }
        }),
        prisma.match.count({
            where: {
                messages: {
                    some: {
                        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo }
                    }
                }
            }
        }),
    ]);

    if (lastWeekConversations > 0) {
        const convDecline = ((lastWeekConversations - thisWeekConversations) / lastWeekConversations) * 100;
        if (convDecline > 30) {
            alerts.push({
                type: 'conversation_drop',
                severity: 'high',
                message: `Conversaciones activas disminuyeron ${convDecline.toFixed(0)}%`,
                metric: 'Conversaciones',
                current: thisWeekConversations,
                previous: lastWeekConversations,
                change: -convDecline,
            });
        }
    }

    // 3. Critical ratio regions
    const health = await getRegionalHealth('global');
    if (health.saturationLevel === 'critical') {
        alerts.push({
            type: 'female_decline',
            severity: 'high',
            message: `Ratio global crítico: ${health.ratio}:1 — ${(health.activeWomen)} mujeres vs ${health.activeMen} hombres`,
            metric: 'Ratio global',
            current: health.activeWomen,
            previous: health.activeMen,
            change: 0,
        });
    }

    return alerts;
}
