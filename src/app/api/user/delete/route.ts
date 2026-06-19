import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { utapi } from '../../uploadthing/core';

async function getUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: NextRequest) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get all user's files (photos, verification selfie, voice intro, chat images/voices)
        const [profile, verificationSubmission, userMessages] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { photos: true, voiceIntro: true }
            }),
            prisma.verificationSubmission.findFirst({
                where: { userId: user.id },
                select: { selfieUrl: true }
            }),
            prisma.message.findMany({
                where: { senderId: user.id, type: { in: ['image', 'voice'] } },
                select: { content: true, type: true },
            })
        ]);

        const filesToDelete: string[] = [];

        // Add profile photos
        if (profile?.photos) {
            filesToDelete.push(...profile.photos);
        }

        // Add verification selfie
        if (verificationSubmission?.selfieUrl) {
            filesToDelete.push(verificationSubmission.selfieUrl);
        }

        // Add voice intro
        if (profile?.voiceIntro) {
            filesToDelete.push(profile.voiceIntro);
        }

        // Add chat image and voice message files
        for (const msg of userMessages) {
            try {
                if (msg.type === 'image') {
                    // Image messages store the URL directly as content
                    if (msg.content && msg.content.startsWith('http')) {
                        filesToDelete.push(msg.content);
                    }
                } else if (msg.type === 'voice') {
                    // Voice messages store JSON: {"audioUrl":"...","duration":N}
                    const parsed = JSON.parse(msg.content);
                    if (parsed.audioUrl) {
                        filesToDelete.push(parsed.audioUrl);
                    }
                }
            } catch {
                // Skip malformed content
            }
        }

        // Delete all from UploadThing
        if (filesToDelete.length > 0) {
            try {
                await utapi.deleteFiles(filesToDelete);
            } catch (deleteErr) {
                console.error('Failed to delete user files from UploadThing:', deleteErr);
            }
        }

        // Delete Supabase auth user to prevent continued authentication
        // Requires service_role key — anon key cannot delete auth users
        const { createClient: createServiceClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteAuthError) {
            console.error('Failed to delete Supabase auth user:', deleteAuthError);
            // Continue with Prisma deletion even if auth deletion fails
        }

        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { userId: user.id } }),
            prisma.notificationPreference.deleteMany({ where: { userId: user.id } }),
            prisma.pushToken.deleteMany({ where: { userId: user.id } }),
            prisma.session.deleteMany({ where: { userId: user.id } }),
            prisma.analyticsEvent.deleteMany({ where: { userId: user.id } }),
            prisma.deviceFingerprint.deleteMany({ where: { userId: user.id } }),
            prisma.verificationSubmission.deleteMany({ where: { userId: user.id } }),
            prisma.dailyAnswer.deleteMany({ where: { userId: user.id } }),
            prisma.quizResult.deleteMany({ where: { userId: user.id } }),
            prisma.profileVisit.deleteMany({ where: { OR: [{ visitorId: user.id }, { visitedId: user.id }] } }),
            prisma.message.deleteMany({ where: { senderId: user.id } }),
            prisma.match.deleteMany({
                where: {
                    OR: [
                        { user1Id: user.id },
                        { user2Id: user.id }
                    ]
                }
            }),
            prisma.interaction.deleteMany({
                where: {
                    OR: [
                        { fromUserId: user.id },
                        { toUserId: user.id }
                    ]
                }
            }),
            prisma.favorite.deleteMany({ where: { userId: user.id } }),
            prisma.block.deleteMany({
                where: {
                    OR: [
                        { blockerId: user.id },
                        { blockedId: user.id }
                    ]
                }
            }),
            prisma.report.deleteMany({
                where: {
                    OR: [
                        { reporterId: user.id },
                        { reportedId: user.id }
                    ]
                }
            }),
            prisma.profile.deleteMany({ where: { userId: user.id } }),
            prisma.user.delete({ where: { id: user.id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
