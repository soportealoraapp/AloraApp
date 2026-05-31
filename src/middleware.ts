import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP, SECURITY_HEADERS } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const csp = getCSP();

    const requestHeaders = new Headers(request.headers);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    const response = await updateSession(modifiedRequest);
    const { data: { user } } = await (await createClient(modifiedRequest, response)).auth.getUser();

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
        pathname.startsWith('/support');

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
            return NextResponse.redirect(new URL('/discover', modifiedRequest.url));
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
