import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function GET(request: Request) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResponse = await withRateLimit(user.id, 'passedRead');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(request.url);
    const intent = searchParams.get('intent');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const cursor = searchParams.get('cursor');

    const where: any = {
      fromUserId: user.id,
      type: 'pass',
      deletedAt: null,
    };
    if (intent) where.intent = intent;
    if (cursor) where.createdAt = { lt: new Date(cursor) };

    const passes = await prisma.interaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
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

    const mapped = passes
      .filter(p => p.toUser?.profile)
      .map(p => ({
        id: p.toUser.id,
        ...p.toUser.profile,
        intent: p.intent,
        passedAt: p.createdAt,
      }));

    const hasMore = mapped.length > limit;
    const profiles = hasMore ? mapped.slice(0, limit) : mapped;
    const nextCursor = hasMore && profiles.length > 0
      ? new Date(profiles[profiles.length - 1].passedAt).toISOString()
      : null;

    return NextResponse.json({ profiles, hasMore, nextCursor });
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

  const rateLimitResponse = await withRateLimit(user.id, 'passedRead');
  if (rateLimitResponse) return rateLimitResponse;

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
