import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export const dynamic = 'force-dynamic';

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
    const [likesCount, matchesCount, viewsCount] = await Promise.all([
      prisma.interaction.count({
        where: {
          toUserId: user.id,
          type: { in: ['like', 'superlike'] },
          deletedAt: null,
        },
      }),
      prisma.match.count({
        where: {
          OR: [{ user1Id: user.id }, { user2Id: user.id }],
          isActive: true,
        },
      }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT "visitorId") as count
        FROM "profile_visits"
        WHERE "visitedId" = ${user.id}
      `,
    ]);

    return NextResponse.json({
      likesReceived: likesCount,
      matchesCount,
      profileViews: viewsCount,
    });
  } catch (error) {
    console.error('Error fetching profile stats:', error);
    return NextResponse.json({ likesReceived: 0, matchesCount: 0, profileViews: 0 });
  }
}
