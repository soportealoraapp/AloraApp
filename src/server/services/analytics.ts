import { prisma } from '@/lib/prisma';

export type AnalyticsEventType =
    | 'signup'
    | 'onboarding_complete'
    | 'first_match'
    | 'first_message'
    | 'first_reply'
    | 'daily_active'
    | 'weekly_active'
    | 'monthly_active';

export async function trackEvent(
    userId: string,
    event: AnalyticsEventType,
    metadata?: Record<string, any>,
    sessionId?: string,
) {
    try {
        await prisma.analyticsEvent.create({
            data: {
                userId,
                event,
                metadata: metadata || undefined,
                sessionId,
            },
        });
    } catch (error) {
        console.error('Analytics event error:', error);
    }
}

// ========== FUNNEL ==========

export interface FunnelStep {
    label: string;
    event: AnalyticsEventType;
    count: number;
    conversionRate: number | null;
}

export async function getFunnelData(days: number = 30): Promise<FunnelStep[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const startCount = await prisma.analyticsEvent.count({
        where: { event: 'signup', createdAt: { gte: since } },
    });

    const steps: { label: string; event: AnalyticsEventType }[] = [
        { label: 'Registros', event: 'signup' },
        { label: 'Onboarding completo', event: 'onboarding_complete' },
        { label: 'Primer match', event: 'first_match' },
        { label: 'Primer mensaje', event: 'first_message' },
        { label: 'Primera respuesta', event: 'first_reply' },
    ];

    const funnel: FunnelStep[] = [];
    let previousCount = startCount;

    for (const step of steps) {
        const count = await prisma.analyticsEvent.count({
            where: { event: step.event, createdAt: { gte: since } },
        });
        funnel.push({
            label: step.label,
            event: step.event,
            count,
            conversionRate: previousCount > 0 ? Math.round((count / previousCount) * 100) : null,
        });
        previousCount = count;
    }

    return funnel;
}

// ========== RETENTION ==========

export interface RetentionRow {
    date: string;
    newUsers: number;
    d1: number;
    d1Percent: number;
    d7: number;
    d7Percent: number;
    d30: number;
    d30Percent: number;
}

export async function getRetentionData(days: number = 30): Promise<RetentionRow[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const signups = await prisma.analyticsEvent.findMany({
        where: { event: 'signup', createdAt: { gte: since } },
        select: { userId: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });

    const rows: RetentionRow[] = [];
    const dayBuckets = new Map<string, { userIds: Set<string>; date: Date }>();

    for (const s of signups) {
        if (!s.userId) continue;
        const dayKey = s.createdAt.toISOString().slice(0, 10);
        if (!dayBuckets.has(dayKey)) {
            dayBuckets.set(dayKey, { userIds: new Set(), date: s.createdAt });
        }
        dayBuckets.get(dayKey)!.userIds.add(s.userId);
    }

    for (const [dayKey, bucket] of dayBuckets) {
        const userIds = Array.from(bucket.userIds);
        const newUsers = userIds.length;

        const d1Date = new Date(bucket.date.getTime() + 1 * 24 * 60 * 60 * 1000);
        const d7Date = new Date(bucket.date.getTime() + 7 * 24 * 60 * 60 * 1000);
        const d30Date = new Date(bucket.date.getTime() + 30 * 24 * 60 * 60 * 1000);

        const [d1Count, d7Count, d30Count] = await Promise.all([
            prisma.analyticsEvent.count({
                where: {
                    userId: { in: userIds },
                    event: 'daily_active',
                    createdAt: { gte: bucket.date, lt: d1Date },
                },
            }),
            prisma.analyticsEvent.count({
                where: {
                    userId: { in: userIds },
                    event: 'weekly_active',
                    createdAt: { gte: d1Date, lt: d7Date },
                },
            }),
            prisma.analyticsEvent.count({
                where: {
                    userId: { in: userIds },
                    event: 'monthly_active',
                    createdAt: { gte: d7Date, lt: d30Date },
                },
            }),
        ]);

        rows.push({
            date: dayKey,
            newUsers,
            d1: d1Count,
            d1Percent: newUsers > 0 ? Math.round((d1Count / newUsers) * 100) : 0,
            d7: d7Count,
            d7Percent: newUsers > 0 ? Math.round((d7Count / newUsers) * 100) : 0,
            d30: d30Count,
            d30Percent: newUsers > 0 ? Math.round((d30Count / newUsers) * 100) : 0,
        });
    }

    return rows.sort((a, b) => a.date.localeCompare(b.date));
}

// ========== ENGAGEMENT HEATMAP ==========

export interface HeatmapEntry {
    dayOfWeek: number; // 0=Sunday
    hour: number;      // 0-23
    count: number;
}

export async function getHeatmapData(days: number = 30): Promise<HeatmapEntry[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await prisma.analyticsEvent.findMany({
        where: {
            event: 'daily_active',
            createdAt: { gte: since },
        },
        select: { createdAt: true },
    });

    const heatmap = new Map<string, number>();
    for (const e of events) {
        const dayOfWeek = e.createdAt.getDay();
        const hour = e.createdAt.getHours();
        const key = `${dayOfWeek}-${hour}`;
        heatmap.set(key, (heatmap.get(key) || 0) + 1);
    }

    const result: HeatmapEntry[] = [];
    for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
            const key = `${d}-${h}`;
            result.push({ dayOfWeek: d, hour: h, count: heatmap.get(key) || 0 });
        }
    }

    return result;
}

// ========== ACTIVE USERS OVER TIME ==========

export interface ActiveUsersPoint {
    date: string;
    dau: number;
    wau: number;
    mau: number;
}

export async function getActiveUsersOverTime(days: number = 90): Promise<ActiveUsersPoint[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const dailyEvents = await prisma.analyticsEvent.groupBy({
        by: ['createdAt'],
        where: {
            event: 'daily_active',
            createdAt: { gte: since },
        },
        _count: { id: true },
    });
    // GroupBy by DateTime isn't ideal; use raw query for production.
    // Instead, count distinct userId per day:
    const raw = await prisma.$queryRaw<{ date: string; cnt: bigint }[]>`
        SELECT DATE("created_at") as date, COUNT(DISTINCT "user_id") as cnt
        FROM "analytics_events"
        WHERE event = 'daily_active' AND "created_at" >= ${since}
        GROUP BY DATE("created_at")
        ORDER BY date ASC
    `;

    const points: ActiveUsersPoint[] = [];
    let cumulativeWau = 0;
    let cumulativeMau = 0;

    for (const row of raw) {
        const dateStr = typeof row.date === 'string' ? row.date : String(row.date);
        const dau = Number(row.cnt);

        // Weekly and monthly are approximations from daily data
        const dateObj = new Date(dateStr);
        const weekAgo = new Date(dateObj.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(dateObj.getTime() - 30 * 24 * 60 * 60 * 1000);

        const wauResult = await prisma.$queryRaw<{ cnt: bigint }[]>`
            SELECT COUNT(DISTINCT "user_id") as cnt
            FROM "analytics_events"
            WHERE event = 'weekly_active' AND "created_at" >= ${weekAgo} AND "created_at" <= ${dateObj}
        `;

        const mauResult = await prisma.$queryRaw<{ cnt: bigint }[]>`
            SELECT COUNT(DISTINCT "user_id") as cnt
            FROM "analytics_events"
            WHERE event = 'monthly_active' AND "created_at" >= ${monthAgo} AND "created_at" <= ${dateObj}
        `;

        points.push({
            date: dateStr,
            dau,
            wau: Number(wauResult[0]?.cnt || 0),
            mau: Number(mauResult[0]?.cnt || 0),
        });
    }

    return points;
}

// ========== EXPORT ==========

export function funnelToCSV(funnel: FunnelStep[]): string {
    const header = 'Paso,Evento,Usuarios,Conversion %';
    const rows = funnel.map(f =>
        `${f.label},${f.event},${f.count},${f.conversionRate !== null ? f.conversionRate + '%' : 'N/A'}`
    );
    return [header, ...rows].join('\n');
}

export function retentionToCSV(rows: RetentionRow[]): string {
    const header = 'Fecha,Nuevos Usuarios,D1,D1%,D7,D7%,D30,D30%';
    const data = rows.map(r =>
        `${r.date},${r.newUsers},${r.d1},${r.d1Percent}%,${r.d7},${r.d7Percent}%,${r.d30},${r.d30Percent}%`
    );
    return [header, ...data].join('\n');
}
