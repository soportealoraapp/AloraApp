import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { profileService } from '@/lib/firebase/profile-service';
import { requireAuth } from '@/lib/middleware/auth';

// GET /api/profile
export async function GET(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const profile = await profileService.getProfile(decoded.uid);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT /api/profile
export async function PUT(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const updates = await request.json();

        // Remove protected fields
        delete updates.uid;
        delete updates.isVerified;
        delete updates.verificationStatus;
        delete updates.createdAt;

        await profileService.updateProfile(decoded.uid, updates);
        const updatedProfile = await profileService.getProfile(decoded.uid);

        return NextResponse.json(updatedProfile);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/profile
export async function DELETE(request: NextRequest) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        await profileService.deleteProfile(decoded.uid);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
