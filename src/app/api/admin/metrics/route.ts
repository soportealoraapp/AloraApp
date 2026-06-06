import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireModerator } from '@/lib/middleware/admin';

export async function GET() {
    const auth = await requireModerator();
    if (auth) return auth;

    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(todayStart.getTime() - 7 * 86400000);
        const monthAgo = new Date(todayStart.getTime() - 30 * 86400000);

        const [
            totalUsers,
            totalProfiles,
            totalMatches,
            totalMessages,
            totalReports,
            pendingReports,
            pendingVerifications,
            dailyActiveUsers,
            weeklyActiveUsers,
            monthlyActiveUsers,
            usersToday,
            matchesToday,
            messagesToday,
            reportsToday,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.profile.count(),
            prisma.match.count({ where: { isActive: true } }),
            prisma.message.count(),
            prisma.report.count(),
            prisma.report.count({ where: { status: 'pending' } }),
            prisma.verificationSubmission.count({ where: { status: 'pending' } }),
            prisma.profile.count({ where: { lastActiveAt: { gte: todayStart } } }),
            prisma.profile.count({ where: { lastActiveAt: { gte: weekAgo } } }),
            prisma.profile.count({ where: { lastActiveAt: { gte: monthAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.match.count({ where: { createdAt: { gte: todayStart }, isActive: true } }),
            prisma.message.count({ where: { createdAt: { gte: todayStart } } }),
            prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
        ]);

        const matchRate = messagesToday > 0 ? ((matchesToday / Math.max(usersToday, 1)) * 100).toFixed(1) : '0';

        return NextResponse.json({
            overview: {
                totalUsers,
                totalProfiles,
                totalMatches,
                totalMessages,
                totalReports,
                pendingReports,
                pendingVerifications,
            },
            activity: {
                dau: dailyActiveUsers,
                wau: weeklyActiveUsers,
                mau: monthlyActiveUsers,
                stickiness: monthlyActiveUsers > 0 ? ((dailyActiveUsers / monthlyActiveUsers) * 100).toFixed(1) : '0',
            },
            daily: {
                newUsers: usersToday,
                newMatches: matchesToday,
                messagesSent: messagesToday,
                reportsFiled: reportsToday,
                matchRate: `${matchRate}%`,
            },
        });
    } catch (error) {
        console.error('Error fetching metrics:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
