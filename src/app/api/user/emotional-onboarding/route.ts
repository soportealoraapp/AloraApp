import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getServerUser() {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Store onboarding answers in analytics for later use
        await prisma.analyticsEvent.create({
            data: {
                userId: user.id,
                event: 'emotional_onboarding',
                timestamp: new Date(),
                metadata: {
                    goals: data.goals,
                    values: data.values,
                    personality: data.personality,
                    lookingFor: data.lookingFor,
                    avoid: data.avoid,
                },
            }
        });

        // Update profile with selected values
        if (data.values && data.values.length > 0) {
            await prisma.profile.update({
                where: { userId: user.id },
                data: {
                    values: data.values,
                    lookingFor: data.lookingFor || null,
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving emotional onboarding:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
