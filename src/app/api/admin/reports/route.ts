import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const [reports, total] = await Promise.all([
            prisma.report.findMany({
                where: { status },
                include: {
                    reporter: { select: { id: true, email: true, name: true } },
                    reported: {
                        select: {
                            id: true, email: true, name: true,
                            profile: { select: { displayName: true, photos: true, trustStatus: true, isVerified: true, reputationScore: true } }
                        }
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.report.count({ where: { status } }),
        ]);

        // Get report count per reported user
        const reportCounts = await prisma.report.groupBy({
            by: ['reportedId'],
            _count: { id: true },
            where: { reportedId: { in: reports.map(r => r.reportedId) } },
        });

        const reportCountMap = new Map(reportCounts.map(r => [r.reportedId, r._count.id]));

        const formatted = reports.map(r => ({
            ...r,
            reportCount: reportCountMap.get(r.reportedId) || 0,
        }));

        return NextResponse.json({
            reports: formatted,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error('Error fetching reports:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireModerator();
    if (auth) return auth;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { reportId, action, reason } = await request.json();

        if (!reportId || !action) {
            return NextResponse.json({ error: 'Missing reportId or action' }, { status: 400 });
        }

        const report = await prisma.report.findUnique({ where: { id: reportId } });
        if (!report) {
            return NextResponse.json({ error: 'Report not found' }, { status: 404 });
        }

        const updates: any = { status: 'reviewed' };

        switch (action) {
            case 'ignore':
                updates.status = 'dismissed';
                break;
            case 'warn':
                updates.status = 'resolved';
                await prisma.notification.create({
                    data: {
                        userId: report.reportedId,
                        type: 'system',
                        title: 'Aviso de moderación',
                        body: reason || 'Has recibido un aviso por comportamiento inapropiado.',
                    }
                });
                break;
            case 'shadowban':
                updates.status = 'resolved';
                await prisma.profile.update({
                    where: { userId: report.reportedId },
                    data: { isShadowBanned: true, reputationScore: { decrement: 30 } },
                });
                break;
            case 'suspend':
                updates.status = 'resolved';
                await prisma.profile.update({
                    where: { userId: report.reportedId },
                    data: { trustStatus: 'watchlist', reputationScore: { decrement: 50 } },
                });
                break;
            case 'ban':
                updates.status = 'resolved';
                await prisma.profile.update({
                    where: { userId: report.reportedId },
                    data: { trustStatus: 'banned', isShadowBanned: true, reputationScore: 0 },
                });
                await prisma.match.updateMany({
                    where: { OR: [{ user1Id: report.reportedId }, { user2Id: report.reportedId }], isActive: true },
                    data: { isActive: false, stage: 'unmatched', deletedAt: new Date() },
                });
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await prisma.report.update({
            where: { id: reportId },
            data: updates,
        });

        await prisma.auditLog.create({
            data: {
                userId: adminUser.id,
                action: `admin_${action}`,
                details: { reportId, targetUserId: report.reportedId, reason },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating report:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
