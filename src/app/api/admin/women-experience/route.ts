import { NextResponse } from 'next/server';
import { getWomenExperienceAudit } from '@/server/services/women-experience-audit';
import { requireAdmin } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireAdmin();
    if (auth) return auth;

    try {
        const audit = await getWomenExperienceAudit();
        return NextResponse.json(audit);
    } catch (error) {
        console.error('Error getting women experience audit:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
