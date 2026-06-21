import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

// GET /api/travel — Get travel mode status
export async function GET() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileRead');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: {
                travelModeEnabled: true,
                travelCity: true,
                travelCountryCode: true,
                travelLatitude: true,
                travelLongitude: true,
                travelStartedAt: true,
                subscriptionStatus: true,
            }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        return NextResponse.json({
            enabled: profile.travelModeEnabled,
            city: profile.travelCity,
            countryCode: profile.travelCountryCode,
            latitude: profile.travelLatitude,
            longitude: profile.travelLongitude,
            startedAt: profile.travelStartedAt,
            isPlus: profile.subscriptionStatus === 'plus'
        });
    } catch (error) {
        console.error('Error getting travel status:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/travel — Activate/deactivate travel mode
export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResponse = await withRateLimit(user.id, 'profileUpdate');
    if (rateLimitResponse) return rateLimitResponse;

    try {
        const { ensureSubscriptionState } = await import('@/lib/subscription-helper');
        await ensureSubscriptionState(user.id);

        const { enabled, cityId } = await request.json();

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { subscriptionStatus: true }
        });

        if (!profile) {
            return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
        }

        // Travel mode is a Plus feature
        if (enabled && profile.subscriptionStatus !== 'plus') {
            return NextResponse.json({ error: 'Travel mode is a Plus feature' }, { status: 403 });
        }

        let updateData: Record<string, unknown> = {};

        if (enabled) {
            if (cityId) {
                // Look up city from our static data
                const { getCityById } = await import('@/lib/location');
                const result = getCityById(cityId);

                if (!result) {
                    return NextResponse.json({ error: 'City not found' }, { status: 404 });
                }

                updateData = {
                    travelModeEnabled: true,
                    travelCity: result.city.name,
                    travelCountryCode: result.city.countryCode,
                    travelLatitude: result.city.lat,
                    travelLongitude: result.city.lng,
                    travelStartedAt: new Date(),
                };
            } else {
                // Re-enable with existing travel data (city already configured from a previous call)
                const existing = await prisma.profile.findUnique({
                    where: { userId: user.id },
                    select: { travelCity: true, travelCountryCode: true, travelLatitude: true, travelLongitude: true }
                });

                if (!existing?.travelCity) {
                    return NextResponse.json({ error: 'Select a city first' }, { status: 400 });
                }

                updateData = {
                    travelModeEnabled: true,
                    travelStartedAt: new Date(),
                };
            }
        } else {
            updateData = {
                travelModeEnabled: false,
                travelCity: null,
                travelCountryCode: null,
                travelLatitude: null,
                travelLongitude: null,
                travelStartedAt: null,
            };
        }

        await prisma.profile.update({
            where: { userId: user.id },
            data: updateData
        });

        // Track analytics
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: enabled ? 'travel_mode_activated' : 'travel_mode_deactivated',
                metadata: enabled ? { cityId, city: updateData.travelCity as string } : {}
            }
        }).catch(() => {});

        return NextResponse.json({ success: true, enabled });
    } catch (error) {
        console.error('Error updating travel mode:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
