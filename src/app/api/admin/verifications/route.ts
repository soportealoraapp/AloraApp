import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware/admin';
import { sendPushToUser, notifyVerificationApproved, notifyVerificationRejected } from '@/server/services/push';
import { utapi } from '../../uploadthing/core';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth) return auth;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const submissions = await prisma.verificationSubmission.findMany({
            where: { status },
            include: {
                user: {
                    select: {
                        id: true, email: true, name: true,
                        profile: { select: { displayName: true, age: true, gender: true, photos: true, trustStatus: true, isVerified: true } }
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        });

        const total = await prisma.verificationSubmission.count({ where: { status } });

        return NextResponse.json({ submissions, total, page, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Error fetching verifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth) return auth;
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateLimitResponse = await withRateLimit(adminUser.id, 'adminAction');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { submissionId, action, reason } = await request.json();

        if (!submissionId || !action) {
            return NextResponse.json({ error: 'Missing submissionId or action' }, { status: 400 });
        }

        const submission = await prisma.verificationSubmission.findUnique({ where: { id: submissionId } });
        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        if (action === 'approve') {
            await prisma.verificationSubmission.update({
                where: { id: submissionId },
                data: { status: 'approved', reviewedBy: adminUser.id, reviewedAt: new Date() },
            });
            await prisma.profile.update({
                where: { userId: submission.userId },
                data: { isVerified: true, trustStatus: 'trusted' },
            });
            await notifyVerificationApproved(submission.userId);
        } else if (action === 'reject') {
            await prisma.verificationSubmission.update({
                where: { id: submissionId },
                data: { status: 'rejected', reason: reason || 'Selfie no clara', reviewedBy: adminUser.id, reviewedAt: new Date() },
            });
            await notifyVerificationRejected(submission.userId, reason || 'No pudimos verificar tu identidad. Intenta de nuevo con una selfie más clara.');
            // Delete the rejected selfie from UploadThing
            try {
                await utapi.deleteFiles([submission.selfieUrl]);
            } catch (deleteErr) {
                console.error('Failed to delete rejected verification selfie from UploadThing:', deleteErr);
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await prisma.auditLog.create({
            data: {
                userId: adminUser.id,
                action: `admin_verification_${action}`,
                details: { submissionId, targetUserId: submission.userId, reason },
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating verification:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
