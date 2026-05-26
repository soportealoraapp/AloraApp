import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/middleware/admin';

export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
                data: { status: 'approved', reviewedBy: auth.user.id, reviewedAt: new Date() },
            });
            await prisma.profile.update({
                where: { userId: submission.userId },
                data: { isVerified: true, trustStatus: 'trusted' },
            });
            await prisma.notification.create({
                data: {
                    userId: submission.userId,
                    type: 'system',
                    title: '¡Identidad verificada!',
                    body: 'Tu verificación ha sido aprobada. Ahora tienes el badge azul en tu perfil.',
                    data: { screen: '/settings/verification' },
                }
            });
        } else if (action === 'reject') {
            await prisma.verificationSubmission.update({
                where: { id: submissionId },
                data: { status: 'rejected', reason: reason || 'Selfie no clara', reviewedBy: auth.user.id, reviewedAt: new Date() },
            });
            await prisma.notification.create({
                data: {
                    userId: submission.userId,
                    type: 'system',
                    title: 'Verificación rechazada',
                    body: reason || 'No pudimos verificar tu identidad. Intenta de nuevo con una selfie más clara.',
                    data: { screen: '/settings/verification' },
                }
            });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await prisma.auditLog.create({
            data: {
                userId: auth.user.id,
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
