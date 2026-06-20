import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const targetUserId = request.nextUrl.searchParams.get('targetUserId');
  const intent = request.nextUrl.searchParams.get('intent') as 'dating' | 'friendship' | null;
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId required' }, { status: 400 });
  }

  const [u1, u2] = [user.id, targetUserId].sort();

  const matchWhere: any = {
    OR: [
      { user1Id: u1, user2Id: u2, isActive: true },
      { user1Id: u2, user2Id: u1, isActive: true },
    ],
  };
  if (intent) {
    matchWhere.intent = intent;
  }

  const match = await prisma.match.findFirst({
    where: matchWhere,
    select: { id: true, intent: true },
  });

  // Check existing interaction from current user to target
  const interactionWhere: any = {
    fromUserId: user.id,
    toUserId: targetUserId,
    deletedAt: null,
  };
  if (intent) {
    interactionWhere.intent = intent;
  }

  const interaction = await prisma.interaction.findFirst({
    where: interactionWhere,
    select: { type: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({
    matched: !!match,
    matchId: match?.id || null,
    intent: match?.intent || null,
    interactionType: interaction?.type || null,
  });
}
