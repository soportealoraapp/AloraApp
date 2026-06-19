import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware/admin';
import { grantPlus, revokePlus } from '@/lib/subscription-helper';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin();
    if (auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const trustStatus = searchParams.get('trustStatus');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { profile: { displayName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (trustStatus && trustStatus !== 'all') {
            where.profile = { ...where.profile, trustStatus };
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true, email: true, name: true, role: true, isActive: true, createdAt: true,
                    profile: { select: { displayName: true, age: true, gender: true, photos: true, trustStatus: true, isVerified: true, isShadowBanned: true, reputationScore: true, subscriptionStatus: true } },
                    _count: { select: { reportsSent: true, reportsReceived: true, sentMessages: true, matchesAsUser1: true, matchesAsUser2: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);

        return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const auth = await requireSuperAdmin();
    if (auth) return auth;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { userId, action, value, reason } = await request.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
        }

        switch (action) {
            case 'ban':
                await prisma.profile.update({ where: { userId }, data: { trustStatus: 'banned', reputationScore: 0 } });
                await prisma.match.updateMany({
                    where: { OR: [{ user1Id: userId }, { user2Id: userId }], isActive: true },
                    data: { isActive: false, stage: 'unmatched', deletedAt: new Date() },
                });
                break;
            case 'shadowban':
                await prisma.profile.update({ where: { userId }, data: { isShadowBanned: true, reputationScore: { decrement: 30 } } });
                break;
            case 'suspend':
                await prisma.profile.update({ where: { userId }, data: { trustStatus: 'watchlist', reputationScore: { decrement: 50 } } });
                break;
            case 'unban':
                await prisma.profile.update({ where: { userId }, data: { trustStatus: 'clean', isShadowBanned: false } });
                break;
            case 'verify':
                await prisma.profile.update({ where: { userId }, data: { isVerified: true } });
                break;
            case 'grant_plus':
                await grantPlus(userId, 30);
                break;
            case 'revoke_plus':
                await revokePlus(userId);
                break;
            case 'set_role':
                if (!['user', 'moderator', 'admin'].includes(value)) {
                    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
                }
                await prisma.user.update({ where: { id: userId }, data: { role: value } });
                break;
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await prisma.auditLog.create({
            data: {
                userId: adminUser.id,
                action: `admin_user_${action}`,
                details: { targetUserId: userId, value, reason },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
