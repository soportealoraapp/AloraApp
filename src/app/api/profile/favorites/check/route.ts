import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const profileId = request.nextUrl.searchParams.get('profileId');
  if (!profileId) {
    return NextResponse.json({ error: 'profileId required' }, { status: 400 });
  }

  try {
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_profileId: {
          userId: user.id,
          profileId,
        },
      },
    });

    return NextResponse.json({ isFavorited: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    return NextResponse.json({ isFavorited: false });
  }
}
