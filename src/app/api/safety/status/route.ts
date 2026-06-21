import { NextResponse } from 'next/server';
import { getSafetyStatus } from '@/server/services/women-safety';
import { getServerUser } from '@/lib/middleware/auth';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rateLimitResponse = await withRateLimit(user.id, 'notification');
        if (rateLimitResponse) return rateLimitResponse;

        const status = await getSafetyStatus(user.id);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error getting safety status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
