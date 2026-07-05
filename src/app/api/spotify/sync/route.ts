import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withRateLimit } from '@/server/utils/api-rate-limit';
import { decryptToken, encryptToken, refreshAccessToken, getTopTracks, getTopArtists } from '@/lib/spotify';

export async function POST(_request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimitResponse = await withRateLimit(user.id, 'spotify');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const spotifyAccount = await prisma.spotifyAccount.findUnique({
      where: { userId: user.id },
    });

    if (!spotifyAccount) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 400 });
    }

    const refreshToken = decryptToken(spotifyAccount.refreshTokenEncrypted);
    const { accessToken, newRefreshToken } = await refreshAccessToken(refreshToken);

    // Store rotated refresh token if Spotify issued a new one
    if (newRefreshToken) {
      await prisma.spotifyAccount.update({
        where: { userId: user.id },
        data: { refreshTokenEncrypted: encryptToken(newRefreshToken) },
      });
    }

    const [topTracks, topArtists] = await Promise.all([
      getTopTracks(accessToken, 10),
      getTopArtists(accessToken, 10),
    ]);

    await prisma.spotifyAccount.update({
      where: { userId: user.id },
      data: {
        topTracks: topTracks as any,
        topArtists: topArtists as any,
        lastSyncedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      topTracks,
      topArtists,
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[spotify/sync] Error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
