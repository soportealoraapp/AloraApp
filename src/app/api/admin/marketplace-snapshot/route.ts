import { NextResponse } from 'next/server';
import { getMarketplaceSnapshot } from '@/server/services/marketplace-balance/engine';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const snapshot = await getMarketplaceSnapshot();
        return NextResponse.json(snapshot);
    } catch (error) {
        console.error('Error getting marketplace snapshot:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
