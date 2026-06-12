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

    try {
        const [profile, spotifyAccount] = await Promise.all([
            prisma.profile.findUnique({ where: { userId: user.id } }),
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

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

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
