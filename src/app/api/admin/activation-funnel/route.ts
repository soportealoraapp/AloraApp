import { NextResponse } from 'next/server';
import { getActivationFunnel, getActivationMetrics } from '@/server/services/activation-funnel';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET(request: Request) {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const extended = searchParams.get('extended') === 'true';

        if (extended) {
            const metrics = await getActivationMetrics();
            return NextResponse.json(metrics);
        }

        const funnel = await getActivationFunnel();
        return NextResponse.json(funnel);
    } catch (error) {
        console.error('Error getting activation funnel:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
