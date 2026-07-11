import { prisma } from '@/lib/prisma';

export type AnalyticsEventType =
    | 'signup'
    | 'onboarding_started'
    | 'onboarding_step_completed'
    | 'onboarding_completed'
    | 'onboarding_abandoned'
    | 'profile_viewed'
    | 'profile_edited'
    | 'profile_photo_added'
    | 'like_sent'
    | 'pass_sent'
    | 'flechado_sent'
    | 'rewind_used'
    | 'match_created'
    | 'first_message'
    | 'first_reply'
    | 'conversation_started'
    | 'conversation_milestone'
    | 'daily_active'
    | 'weekly_active'
    | 'monthly_active'
    | 'paywall_viewed'
    | 'plus_started'
    | 'plus_cancelled'
    | 'boost_activated'
    | 'streak_checkin'
    | 'daily_question_answered'
    | 'daily_compatibility_viewed'
    | 'user_reported'
    | 'user_blocked'
    | 'feedback_submitted'
    | 'travel_mode_activated'
    | 'travel_mode_deactivated'
    | string;

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

/**
 * Signups are sourced from real user-account creation (createdAt) rather than a
 * 'signup' analytics event, which was never emitted. This keeps the funnel and
 * retention metrics truthful.
 */
async function getSignupsSince(since: Date): Promise<{ userId: string; createdAt: Date }[]> {
    const users = await prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { id: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
    });
    return users.map(u => ({ userId: u.id, createdAt: u.createdAt }));
}

export async function getFunnelData(days: number = 30): Promise<FunnelStep[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const startCount = await prisma.user.count({
        where: { createdAt: { gte: since } },
    });

    const steps: { label: string; event: AnalyticsEventType }[] = [
        { label: 'Registros', event: 'signup' },
        { label: 'Onboarding completo', event: 'onboarding_completed' },
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

    const signups = await getSignupsSince(since);

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

    // Collect all userIds and date ranges for batch queries
    const allUserIds = new Set<string>();
    const dateRanges: { dayKey: string; date: Date; d1Date: Date; d7Date: Date; d30Date: Date }[] = [];

    for (const [dayKey, bucket] of dayBuckets) {
        for (const uid of bucket.userIds) allUserIds.add(uid);
        dateRanges.push({
            dayKey,
            date: bucket.date,
            d1Date: new Date(bucket.date.getTime() + 1 * 24 * 60 * 60 * 1000),
            d7Date: new Date(bucket.date.getTime() + 7 * 24 * 60 * 60 * 1000),
            d30Date: new Date(bucket.date.getTime() + 30 * 24 * 60 * 60 * 1000),
        });
    }

    const allUserIdsArray = Array.from(allUserIds);
    if (allUserIdsArray.length === 0) return [];

    // Batch: fetch all daily_active events for all users in the range.
    // D7/D30 retention is derived from daily_active presence within the
    // 7-day / 30-day windows (the separate weekly_active/monthly_active
    // events were never emitted, leaving those columns at 0).
    const allDailyActive = await prisma.analyticsEvent.findMany({
        where: {
            userId: { in: allUserIdsArray },
            event: 'daily_active',
            createdAt: { gte: since, lte: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) },
        },
        select: { userId: true, createdAt: true },
    });

    for (const range of dateRanges) {
        const bucket = dayBuckets.get(range.dayKey)!;
        const userIds = Array.from(bucket.userIds);
        const newUsers = userIds.length;
        const userSet = new Set(userIds);

        const d1Count = allDailyActive.filter(e =>
            e.userId && userSet.has(e.userId) &&
            e.createdAt >= range.date &&
            e.createdAt < range.d1Date
        ).length;

        const d7Count = allDailyActive.filter(e =>
            e.userId && userSet.has(e.userId) &&
            e.createdAt >= range.d1Date &&
            e.createdAt < range.d7Date
        ).length;

        const d30Count = allDailyActive.filter(e =>
            e.userId && userSet.has(e.userId) &&
            e.createdAt >= range.d7Date &&
            e.createdAt < range.d30Date
        ).length;

        rows.push({
            date: range.dayKey,
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

    // Single raw query for DAU per day
    const raw = await prisma.$queryRaw<{ date: string; cnt: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(DISTINCT "userId") as cnt
        FROM "analytics_events"
        WHERE event = 'daily_active' AND "createdAt" >= ${since}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
    `;

    // Single raw query for WAU (distinct users active in rolling 7-day windows)
    const wauRaw = await prisma.$queryRaw<{ date: string; cnt: bigint }[]>`
        WITH daily_dates AS (
            SELECT DISTINCT DATE("createdAt") as date
            FROM "analytics_events"
            WHERE event = 'daily_active' AND "createdAt" >= ${since}
        )
        SELECT dd.date, COUNT(DISTINCT ae."userId") as cnt
        FROM daily_dates dd
        JOIN "analytics_events" ae ON ae.event = 'weekly_active'
            AND ae."createdAt" >= (dd.date::timestamp - INTERVAL '7 days')
            AND ae."createdAt" <= dd.date::timestamp
        GROUP BY dd.date
        ORDER BY dd.date ASC
    `;
    const wauMap = new Map(wauRaw.map(r => [String(r.date), Number(r.cnt)]));

    // Single raw query for MAU (distinct users active in rolling 30-day windows)
    const mauRaw = await prisma.$queryRaw<{ date: string; cnt: bigint }[]>`
        WITH daily_dates AS (
            SELECT DISTINCT DATE("createdAt") as date
            FROM "analytics_events"
            WHERE event = 'daily_active' AND "createdAt" >= ${since}
        )
        SELECT dd.date, COUNT(DISTINCT ae."userId") as cnt
        FROM daily_dates dd
        JOIN "analytics_events" ae ON ae.event = 'monthly_active'
            AND ae."createdAt" >= (dd.date::timestamp - INTERVAL '30 days')
            AND ae."createdAt" <= dd.date::timestamp
        GROUP BY dd.date
        ORDER BY dd.date ASC
    `;
    const mauMap = new Map(mauRaw.map(r => [String(r.date), Number(r.cnt)]));

    const points: ActiveUsersPoint[] = [];
    for (const row of raw) {
        const dateStr = typeof row.date === 'string' ? row.date : String(row.date);
        points.push({
            date: dateStr,
            dau: Number(row.cnt),
            wau: wauMap.get(dateStr) || 0,
            mau: mauMap.get(dateStr) || 0,
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
