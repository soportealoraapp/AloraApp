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

            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
