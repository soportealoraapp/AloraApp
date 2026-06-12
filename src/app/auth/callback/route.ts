import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redeemReferral } from '@/server/actions/referral';
import { REFERRAL_COOKIE, REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/discover';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            try {
                const cookieStore = await cookies();
                const refCookie = cookieStore.get(REFERRAL_COOKIE)?.value ?? '';
                if (refCookie && REFERRAL_CODE_PATTERN.test(refCookie)) {
                    await redeemReferral(refCookie);
                    cookieStore.set(REFERRAL_COOKIE, '', {
                        path: '/',
                        maxAge: 0,
                        sameSite: 'lax',
                        httpOnly: false,
                    });
                }
            } catch (err) {
                console.warn('[auth/callback] referral redemption skipped:', err);
            }

            // Check if user has a completed profile — new Google users must onboard
            let destination = next;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('isCompleted')
                        .eq('userId', user.id)
                        .maybeSingle();

                    if (!profile) {
                        // Create initial profile row for new OAuth users
                        const displayName = user.user_metadata?.full_name
                            || user.user_metadata?.name
                            || user.email?.split('@')[0]
                            || 'Usuario';
                        await supabase.from('profiles').insert({
                            userId: user.id,
                            displayName,
                            photos: user.user_metadata?.avatar_url ? [user.user_metadata.avatar_url] : [],
                            isCompleted: false,
                        });
                        destination = '/onboarding';
                    } else if (!profile.isCompleted) {
                        destination = '/onboarding';
                    }
                }
            } catch (err) {
                console.warn('[auth/callback] profile check/create skipped:', err);
            }

            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${destination}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${destination}`);
            } else {
                return NextResponse.redirect(`${origin}${destination}`);
            }
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
