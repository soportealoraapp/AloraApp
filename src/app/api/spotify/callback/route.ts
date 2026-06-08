import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { exchangeCode, getSpotifyProfile, encryptToken } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login?error=spotify_auth_required', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(new URL('/settings?spotify=error&reason=user_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/settings?spotify=error&reason=invalid_params', request.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get('spotify_oauth_state')?.value;

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/settings?spotify=error&reason=state_mismatch', request.url));
  }

  cookieStore.delete('spotify_oauth_state');

  try {
    const tokens = await exchangeCode(code);
    const spotifyProfile = await getSpotifyProfile(tokens.accessToken);

    const refreshTokenEncrypted = encryptToken(tokens.refreshToken);

    await prisma.spotifyAccount.upsert({
      where: { userId: user.id },
      update: {
        spotifyUserId: spotifyProfile.id,
        displayName: spotifyProfile.displayName,
        refreshTokenEncrypted,
        lastSyncedAt: null,
      },
      create: {
        userId: user.id,
        spotifyUserId: spotifyProfile.id,
        displayName: spotifyProfile.displayName,
        refreshTokenEncrypted,
      },
    });

    return NextResponse.redirect(new URL('/settings?spotify=connected', request.url));
  } catch (err) {
    console.error('[spotify/callback] Error:', err);
    return NextResponse.redirect(new URL('/settings?spotify=error&reason=exchange_failed', request.url));
  }
}
