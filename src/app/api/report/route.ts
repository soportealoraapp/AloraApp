import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { reportService } from '@/lib/firebase/report-service';

// POST /api/report
export async function POST(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const { reportedId, reason, description } = await request.json();

        if (!reportedId || !reason) {
            return NextResponse.json(
                { error: 'reportedId and reason are required' },
                { status: 400 }
            );
        }

        const reportId = await reportService.createReport(
            decoded.uid,
            reportedId,
            reason,
            description
        );

        return NextResponse.json({ reportId, success: true });
    } catch (error) {
        console.error('Error creating report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
