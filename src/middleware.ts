import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP, SECURITY_HEADERS } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const csp = getCSP();

    const requestHeaders = new Headers(request.headers);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    const response = await updateSession(modifiedRequest);
    let user = null;
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), 10000)
        );
        const { data } = await Promise.race([
            (await createClient(modifiedRequest, response)).auth.getUser(),
            timeout,
        ]);
        user = data.user;
    } catch (err) {
        console.warn('middleware: getUser failed', err);
    }

    const pathname = modifiedRequest.nextUrl.pathname;

    const isAppRoute = pathname.startsWith('/discover') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/qa') ||
        pathname.startsWith('/onboarding') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/contact') ||
        pathname.startsWith('/support') ||
        pathname.startsWith('/compatibility') ||
        pathname.startsWith('/match') ||
        pathname.startsWith('/events') ||
        pathname.startsWith('/success-stories') ||
        pathname.startsWith('/why-alora') ||
        pathname.startsWith('/refer') ||
        pathname.startsWith('/app');

    const isAdminRoute = pathname.startsWith('/admin');

    const isAuthRoute = pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/password-update') ||
        pathname.startsWith('/auth');

    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', modifiedRequest.url));
    }

    if (isAdminRoute && user) {
        const supabaseClient = await createClient(modifiedRequest, response);
        const { data: profile } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
            return NextResponse.redirect(new URL('/login', modifiedRequest.url));
        }
    }

    if (isAuthRoute && user && !pathname.startsWith('/auth/callback')) {
        return NextResponse.redirect(new URL('/discover', modifiedRequest.url));
    }

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');

    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value);
    }

    response.headers.set('x-feature-flags', JSON.stringify({
        aiWingman: true,
        superBoost: true
    }));

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
