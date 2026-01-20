import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    // 1. Supabase Auth Session Update & Protection
    const response = await updateSession(request);
    const { data: { user } } = await (await createClient(request, response)).auth.getUser();

    const isAppRoute = request.nextUrl.pathname.startsWith('/discover') ||
        request.nextUrl.pathname.startsWith('/profile') ||
        request.nextUrl.pathname.startsWith('/messages') ||
        request.nextUrl.pathname.startsWith('/chat') ||
        request.nextUrl.pathname.startsWith('/settings') ||
        request.nextUrl.pathname.startsWith('/qa');

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/signup') ||
        request.nextUrl.pathname.startsWith('/auth');

    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && user && !request.nextUrl.pathname.startsWith('/auth/callback')) {
        return NextResponse.redirect(new URL('/discover', request.url));
    }

    // 2. Security Headers (CSP)
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://js.stripe.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        img-src 'self' blob: data: https://lh3.googleusercontent.com https://your-project.supabase.co https://placehold.co https://picsum.photos;
        font-src 'self' data: https://fonts.gstatic.com;
        connect-src 'self' https://securetoken.googleapis.com https://your-project.supabase.co;
        worker-src 'self' blob:;
        frame-src 'self' https://js.stripe.com;
        object-src 'none';
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');

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
