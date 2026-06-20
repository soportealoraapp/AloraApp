import { NextResponse } from 'next/server';
import { getSafetyStatus } from '@/server/services/women-safety';
import { getServerUser } from '@/lib/middleware/auth';

export async function GET() {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const status = await getSafetyStatus(user.id);
        return NextResponse.json(status);
    } catch (error) {
        console.error('Error getting safety status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
