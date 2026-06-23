import { NextRequest, NextResponse } from 'next/server';
import { requireModerator } from '@/lib/middleware/admin';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import {
    getFunnelData,
    getRetentionData,
    getHeatmapData,
    getActiveUsersOverTime,
    funnelToCSV,
    retentionToCSV,
} from '@/server/services/analytics';

export async function GET(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    // Rate limit admin analytics queries
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'funnel';
    const rawDays = parseInt(searchParams.get('days') || '30', 10);
    const days = Math.min(Math.max(1, isNaN(rawDays) ? 30 : rawDays), 90);
    const format = searchParams.get('format');

    try {
        switch (type) {
            case 'funnel': {
                const data = await getFunnelData(days);
                if (format === 'csv') {
                    return new NextResponse(funnelToCSV(data), {
                        headers: {
                            'Content-Type': 'text/csv',
                            'Content-Disposition': `attachment; filename="funnel-${days}d.csv"`,
                        },
                    });
                }
                return NextResponse.json({ funnel: data });
            }
            case 'retention': {
                const data = await getRetentionData(days);
                if (format === 'csv') {
                    return new NextResponse(retentionToCSV(data), {
                        headers: {
                            'Content-Type': 'text/csv',
                            'Content-Disposition': `attachment; filename="retention-${days}d.csv"`,
                        },
                    });
                }
                return NextResponse.json({ retention: data });
            }
            case 'heatmap': {
                const data = await getHeatmapData(days);
                return NextResponse.json({ heatmap: data });
            }
            case 'active': {
                const data = await getActiveUsersOverTime(days);
                return NextResponse.json({ activeUsers: data });
            }
            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
