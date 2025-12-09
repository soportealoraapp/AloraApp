import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware/auth';
import { profileService } from '@/lib/firebase/profile-service';

// GET /api/profile/[userId]
export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    const decoded = await requireAuth(request);
    if (decoded instanceof NextResponse) return decoded;

    try {
        const profile = await profileService.getProfile(params.userId);

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Remove sensitive info if viewing someone else's profile
        if (params.userId !== decoded.uid) {
            const { email, ...publicProfile } = profile;
            return NextResponse.json(publicProfile);
        }

        return NextResponse.json(profile);
    } catch (error) {
        console.error('Error getting profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
