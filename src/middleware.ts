import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP } from '@/lib/security';

export async function middleware(request: NextRequest) {
    // 0. Generate nonce FIRST — needs to be on request headers for Next.js to add to script tags
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // Clone request headers and inject nonce so Next.js SSR picks it up for <script> tags
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    // 1. Supabase Auth Session Update & Protection (uses modified request with nonce)
    const response = await updateSession(modifiedRequest);
    const { data: { user } } = await (await createClient(modifiedRequest, response)).auth.getUser();

    const isAppRoute = modifiedRequest.nextUrl.pathname.startsWith('/discover') ||
        modifiedRequest.nextUrl.pathname.startsWith('/profile') ||
        modifiedRequest.nextUrl.pathname.startsWith('/messages') ||
        modifiedRequest.nextUrl.pathname.startsWith('/chat') ||
        modifiedRequest.nextUrl.pathname.startsWith('/settings') ||
        modifiedRequest.nextUrl.pathname.startsWith('/qa');

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

    // 2. Security Headers (CSP) — nonce must match x-nonce in request headers
    const csp = getCSP(nonce);

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

    // Feature Flags (Soft)
    response.headers.set('x-feature-flags', JSON.stringify({
        aiWingman: true,
        superBoost: true
    }));

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
