import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const passes = await prisma.interaction.findMany({
      where: {
        fromUserId: user.id,
        type: 'pass',
      },
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
        passedAt: p.createdAt,
      }));

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Error fetching passed profiles:', error);
    return NextResponse.json({ profiles: [] });
  }
}
