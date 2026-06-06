import { NextResponse } from 'next/server';
import { getMatchQualityMetrics } from '@/server/services/match-analytics';
import { requireAdmin } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireAdmin();
    if (auth) return auth;

    try {
        const metrics = await getMatchQualityMetrics();
        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error getting match quality metrics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
