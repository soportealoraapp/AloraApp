import { NextResponse } from 'next/server';
import { generateGoNoGoReport } from '@/server/services/go-no-go';
import { requireAdmin } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireAdmin();
    if (auth) return auth;

    try {
        const report = await generateGoNoGoReport();
        return NextResponse.json(report);
    } catch (error) {
        console.error('Error generating Go/No-Go report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
