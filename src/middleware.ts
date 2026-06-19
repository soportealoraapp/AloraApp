/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP, SECURITY_HEADERS } from '@/lib/security';

export async function middleware(request: NextRequest) {
    const csp = getCSP();

    const requestHeaders = new Headers(request.headers);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    // updateSession creates its own response with refreshed Supabase cookies.
    // getUser() triggers automatic token refresh if the JWT is expired.
    const { supabaseResponse: response, user } = await updateSession(modifiedRequest);

    const pathname = modifiedRequest.nextUrl.pathname;

    const applySecurityHeaders = (res: NextResponse) => {
        res.headers.set('Content-Security-Policy', csp);
        res.headers.set('X-DNS-Prefetch-Control', 'on');
        res.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
            res.headers.set(key, value);
        }
        return res;
    };

    const isAppRoute = pathname.startsWith('/discover') ||
        pathname.startsWith('/profile') ||
        pathname.startsWith('/messages') ||
        pathname.startsWith('/chat') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/qa') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/compatibility') ||
        pathname.startsWith('/match') ||
        pathname.startsWith('/events') ||
        pathname.startsWith('/success-stories') ||
        pathname.startsWith('/why-alora') ||
        pathname.startsWith('/refer') ||
        pathname.startsWith('/app');

    const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/qa');

    const isAuthRoute = pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/password-update') ||
        pathname.startsWith('/auth');

    const isApiRoute = pathname.startsWith('/api/');

    if (!user) {
        if (isApiRoute) {
            return applySecurityHeaders(NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            ));
        }
        if (isAppRoute) {
            return applySecurityHeaders(NextResponse.redirect(new URL('/login', modifiedRequest.url)));
        }
    }

    if (isAppRoute && user) {
        try {
            const supabase = await createClient(modifiedRequest, response);
            const profileQuery = supabase
                .from('profiles')
                .select('isCompleted')
                .eq('userId', user.id)
                .maybeSingle();
            const { data: profile } = await Promise.race([
                profileQuery,
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile check timeout')), 5000)
                ),
            ]);
            if (!profile || !profile.isCompleted) {
                return applySecurityHeaders(NextResponse.redirect(new URL('/onboarding', modifiedRequest.url)));
            }
        } catch {
            // Deny access if profile check fails (fail-closed for security)
            return applySecurityHeaders(NextResponse.redirect(new URL('/onboarding', modifiedRequest.url)));
        }
    }

    if (isAdminRoute && user) {
        const { prisma } = await import('@/lib/prisma');
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true }
        });

        if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'super_admin')) {
            return applySecurityHeaders(NextResponse.redirect(new URL('/discover', modifiedRequest.url)));
        }
    }

    if (isAuthRoute && user && !pathname.startsWith('/auth/callback')) {
        // Check if profile is completed — incomplete users go to onboarding
        if (!pathname.startsWith('/onboarding')) {
            try {
                const supabase = await createClient(modifiedRequest, response);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('isCompleted')
                    .eq('userId', user.id)
                    .maybeSingle();

                if (!profile || !profile.isCompleted) {
                    return applySecurityHeaders(NextResponse.redirect(new URL('/onboarding', modifiedRequest.url)));
                }
            } catch {
                // If profile check fails, allow through to avoid blocking
            }
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/discover', modifiedRequest.url)));
    }

    applySecurityHeaders(response);

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
