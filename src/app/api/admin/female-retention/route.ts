import { NextResponse } from 'next/server';
import { getFemaleRetentionMetrics } from '@/server/services/female-retention';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const metrics = await getFemaleRetentionMetrics();
        return NextResponse.json(metrics);
    } catch (error) {
        console.error('Error getting female retention:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
