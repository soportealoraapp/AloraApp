import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const intent = searchParams.get('intent');

    const where: any = {
      fromUserId: user.id,
      type: 'pass',
      deletedAt: null,
    };
    if (intent) where.intent = intent;

    const passes = await prisma.interaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        toUser: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                age: true,
                photos: true,
                city: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    const profiles = passes
      .filter(p => p.toUser?.profile)
      .map(p => ({
        id: p.toUser.id,
        ...p.toUser.profile,
        intent: p.intent,
        passedAt: p.createdAt,
      }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching passed profiles:', error);
    return NextResponse.json({ profiles: [] });
  }
}

export async function POST(request: Request) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'Missing profileId' }, { status: 400 });
    }

    // Mark the pass interaction as definitively excluded
    await prisma.interaction.updateMany({
      where: {
        fromUserId: user.id,
        toUserId: profileId,
        type: 'pass',
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking pass as definitive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
