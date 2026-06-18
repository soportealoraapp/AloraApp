import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
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
            // Only override destination if the user doesn't have a specific next target
            // (e.g., password reset should go to /password-update, not /onboarding)
            const validNextRoutes = ['/password-update', '/discover', '/onboarding', '/settings'];
            const hasSpecificTarget = validNextRoutes.some(route => next.startsWith(route));
            let destination = next;
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const profile = await prisma.profile.findUnique({
                        where: { userId: user.id },
                        select: { isCompleted: true }
                    });

                    if (!profile) {
                        // Create User row if it doesn't exist (Supabase auth.users ≠ Prisma User)
                        const displayName = user.user_metadata?.full_name
                            || user.user_metadata?.name
                            || user.email?.split('@')[0]
                            || 'Usuario';
                        const avatarUrl = user.user_metadata?.avatar_url || null;
                        await prisma.user.upsert({
                            where: { id: user.id },
                            create: {
                                id: user.id,
                                email: user.email || `${user.id}@placeholder.local`,
                                name: displayName,
                            },
                            update: {},
                        });
                        // Create initial profile row for new OAuth users via Prisma
                        await prisma.profile.create({
                            data: {
                                userId: user.id,
                                displayName,
                                photos: avatarUrl ? [avatarUrl] : [],
                                countryCode: user.user_metadata?.locale?.split('-')?.[1] || null,
                                connectionModes: ['dating'],
                                seeking: 'all',
                                isCompleted: false,
                            }
                        });
                        destination = '/onboarding';
                    } else if (!profile.isCompleted && !hasSpecificTarget) {
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
