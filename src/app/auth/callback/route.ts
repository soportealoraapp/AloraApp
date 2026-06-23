import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { redeemReferral } from '@/server/actions/referral';
import { REFERRAL_COOKIE, REFERRAL_CODE_PATTERN } from '@/lib/referral/constants';

const ALLOWED_REDIRECT_PATHS = ['/password-update', '/discover', '/onboarding', '/settings', '/login'];

const ALLOWED_HOSTS = [
    process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, ''),
    'alora.app',
    'www.alora.app',
    'alora-web.web.app',
    'localhost:3000',
].filter(Boolean);

function sanitizeHost(host: string): string | null {
    const lower = host.toLowerCase();
    if (ALLOWED_HOSTS.some(allowed => lower === allowed || lower.endsWith('.' + allowed))) {
        return lower;
    }
    return null;
}

function sanitizeRedirect(next: string): string {
    // Only allow paths that start with / and do not contain :// (protocol) or // (protocol-relative)
    if (!next.startsWith('/') || next.includes('://') || next.startsWith('//')) {
        return '/discover';
    }
    // Only allow known internal paths
    if (!ALLOWED_REDIRECT_PATHS.some(p => next.startsWith(p))) {
        return '/discover';
    }
    // Prevent path traversal
    if (next.includes('..')) {
        return '/discover';
    }
    return next;
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = sanitizeRedirect(searchParams.get('next') ?? '/discover');

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
            const hasSpecificTarget = validNextRoutes.includes(next);
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
                                email: user.email || `no-email-${user.id.slice(0, 8)}@alora.app`,
                                name: displayName,
                            },
                            update: {},
                        });
                        // Create initial profile row for new OAuth users via Prisma
                        await prisma.profile.upsert({
                            where: { userId: user.id },
                            create: {
                                userId: user.id,
                                displayName,
                                photos: avatarUrl ? [avatarUrl] : [],
                                countryCode: user.user_metadata?.locale?.split('-')?.[1] || null,
                                connectionModes: ['dating'],
                                seeking: 'all',
                                isCompleted: false,
                            },
                            update: {},
                        });
                        destination = '/onboarding';
                    } else if (!profile.isCompleted && !hasSpecificTarget) {
                        destination = '/onboarding';
                    }
                }
            } catch (err) {
                console.error('[auth/callback] profile check/create failed:', err);
                // Redirect to error page instead of silently continuing to onboarding
                destination = '/login?error=profile_creation_failed';
            }

            const forwardedHost = request.headers.get('x-forwarded-host');
            const isLocalEnv = process.env.NODE_ENV === 'development';

            // Final validation: ensure destination is always an internal path
            const safeDestination = sanitizeRedirect(destination);

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${safeDestination}`);
            } else if (forwardedHost) {
                const safeHost = sanitizeHost(forwardedHost);
                if (!safeHost) {
                    return NextResponse.redirect(`${origin}${safeDestination}`);
                }
                return NextResponse.redirect(`https://${safeHost}${safeDestination}`);
            } else {
                return NextResponse.redirect(`${origin}${safeDestination}`);
            }
        }
    }

    return NextResponse.redirect(`${origin}/login?error=auth_code_error`);
}
