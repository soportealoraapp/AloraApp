import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EditableProfileSchema, sanitizeProfileUpdates } from '@/lib/schemas/validation';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { utapi } from '../uploadthing/core';

async function getUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function GET(request: NextRequest) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const profile = await prisma.profile.findUnique({ where: { userId: user.id } });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        const now = new Date();
        const lastReset = profile.dailyLikesResetAt;
        const isNewDay = !lastReset || now.toDateString() !== new Date(lastReset).toDateString();

        if (isNewDay && profile.subscriptionStatus === 'free') {
            await prisma.profile.update({
                where: { userId: user.id },
                data: {
                    dailyLikesUsed: 0,
                    dailyLikesResetAt: now,
                    superlikesRemaining: 3,
                    rewindsUsed: 0,
                    rewindsResetAt: now,
                }
            });
            profile.dailyLikesUsed = 0;
            profile.dailyLikesResetAt = now;
            profile.superlikesRemaining = 3;
            profile.rewindsUsed = 0;
            profile.rewindsResetAt = now;
        }

        const [spotifyAccount] = await Promise.all([
            prisma.spotifyAccount.findUnique({
                where: { userId: user.id },
                select: {
                    topTracks: true,
                    topArtists: true,
                    playlistId: true,
                    playlistUrl: true,
                    lastSyncedAt: true,
                },
            }),
        ]);

        return NextResponse.json({ ...profile, spotify: spotifyAccount || null });
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const rawBody = await request.json();
        const allowedUpdates = sanitizeProfileUpdates(rawBody);

        const parsed = EditableProfileSchema.safeParse(allowedUpdates);
        if (!parsed.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: parsed.error.flatten().fieldErrors
            }, { status: 400 });
        }

        // Check for old photos to delete
        const existingProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { photos: true }
        });

        const oldPhotos = existingProfile?.photos || [];
        const newPhotos = parsed.data.photos || [];
        const photosToDelete = oldPhotos.filter(url => !newPhotos.includes(url));

        if (photosToDelete.length > 0) {
            try {
                await utapi.deleteFiles(photosToDelete);
            } catch (deleteErr) {
                console.error('Failed to delete old photos from UploadThing:', deleteErr);
            }
        }

        const updated = await prisma.profile.upsert({
            where: { userId: user.id },
            update: parsed.data,
            create: {
                userId: user.id,
                ...parsed.data
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
