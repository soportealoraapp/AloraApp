import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP, SECURITY_HEADERS } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const csp = getCSP();

    const requestHeaders = new Headers(request.headers);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    const response = await updateSession(modifiedRequest);
    const { data: { user } } = await (await createClient(modifiedRequest, response)).auth.getUser();

    const isAppRoute = modifiedRequest.nextUrl.pathname.startsWith('/discover') ||
        modifiedRequest.nextUrl.pathname.startsWith('/profile') ||
        modifiedRequest.nextUrl.pathname.startsWith('/messages') ||
        modifiedRequest.nextUrl.pathname.startsWith('/chat') ||
        modifiedRequest.nextUrl.pathname.startsWith('/settings') ||
        modifiedRequest.nextUrl.pathname.startsWith('/qa') ||
        modifiedRequest.nextUrl.pathname.startsWith('/onboarding');

    const isAuthRoute = modifiedRequest.nextUrl.pathname.startsWith('/login') ||
        modifiedRequest.nextUrl.pathname.startsWith('/signup') ||
        modifiedRequest.nextUrl.pathname.startsWith('/forgot-password') ||
        modifiedRequest.nextUrl.pathname.startsWith('/password-update') ||
        modifiedRequest.nextUrl.pathname.startsWith('/auth');

    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', modifiedRequest.url));
    }

    if (isAuthRoute && user && !modifiedRequest.nextUrl.pathname.startsWith('/auth/callback')) {
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
