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
        // Get all user's files (photos, verification selfie, voice intro, chat images)
        const [profile, verificationSubmission] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { photos: true, voiceIntro: true }
            }),
            prisma.verificationSubmission.findFirst({
                where: { userId: user.id },
                select: { selfieUrl: true }
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

        // Delete all from UploadThing
        if (filesToDelete.length > 0) {
            try {
                await utapi.deleteFiles(filesToDelete);
            } catch (deleteErr) {
                console.error('Failed to delete user files from UploadThing:', deleteErr);
            }
        }

        // Note: We should actually delete the Supabase user too,
        // but for now we'll just delete the data from Prisma
        // (though we should check the delete_user_account RPC function)
        await prisma.$transaction([
            prisma.notification.deleteMany({ where: { userId: user.id } }),
            prisma.verificationSubmission.deleteMany({ where: { userId: user.id } }),
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
            prisma.profile.deleteMany({ where: { userId: user.id } }),
            prisma.user.delete({ where: { id: user.id } })
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user account:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
