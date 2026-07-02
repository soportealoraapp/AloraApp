import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResponse = await withRateLimit(user.id, 'match');
  if (rateLimitResponse) return rateLimitResponse;

  const { targetUserIds, intent } = await request.json();

  if (!Array.isArray(targetUserIds) || targetUserIds.length === 0 || targetUserIds.length > 50) {
    return NextResponse.json({ error: 'targetUserIds must be a non-empty array of max 50 IDs' }, { status: 400 });
  }

  const matchWhere: any = {
    isActive: true,
    OR: targetUserIds.flatMap((targetId: string) => {
      const [u1, u2] = [user.id, targetId].sort();
      return [
        { user1Id: u1, user2Id: u2 },
        { user1Id: u2, user2Id: u1 },
      ];
    }),
  };
  if (intent && intent !== 'both') {
    matchWhere.intent = intent;
  }

  const matches = await prisma.match.findMany({
    where: matchWhere,
    select: { id: true, user1Id: true, user2Id: true, intent: true },
  });

  const matchMap = new Map<string, { matched: boolean; matchId: string | null }>();
  for (const targetId of targetUserIds) {
    const match = matches.find(m =>
      (m.user1Id === user.id && m.user2Id === targetId) ||
      (m.user1Id === targetId && m.user2Id === user.id)
    );
    matchMap.set(targetId, { matched: !!match, matchId: match?.id || null });
  }

  const interactionWhere: any = {
    fromUserId: user.id,
    toUserId: { in: targetUserIds },
    deletedAt: null,
  };
  if (intent && intent !== 'both') {
    interactionWhere.intent = intent;
  }

  const interactions = await prisma.interaction.findMany({
    where: interactionWhere,
    select: { toUserId: true, type: true },
  });

  const interactionMap = new Map<string, string | null>();
  for (const targetId of targetUserIds) {
    const interaction = interactions.find(i => i.toUserId === targetId);
    interactionMap.set(targetId, interaction?.type || null);
  }

  const result: Record<string, { matched: boolean; matchId: string | null; interactionType: string | null }> = {};
  for (const targetId of targetUserIds) {
    result[targetId] = {
      matched: matchMap.get(targetId)?.matched || false,
      matchId: matchMap.get(targetId)?.matchId || null,
      interactionType: interactionMap.get(targetId) || null,
    };
  }

  return NextResponse.json(result);
}
