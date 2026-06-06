import { NextResponse } from 'next/server';
import { getMarketplaceHealth } from '@/server/services/marketplace-health';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const health = await getMarketplaceHealth();
        return NextResponse.json(health);
    } catch (error) {
        console.error('Error getting marketplace health:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
