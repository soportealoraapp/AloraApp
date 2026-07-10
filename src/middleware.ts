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

// LRU-style in-memory caches with max size and TTL eviction
const MAX_CACHE_SIZE = 1000;

function createCache<T>(maxSize: number) {
    const map = new Map<string, T & { _ts: number }>();
    let lastCleanup = Date.now();
    const CLEANUP_INTERVAL = 60_000; // cleanup every 60s

    function cleanup() {
        const now = Date.now();
        if (now - lastCleanup < CLEANUP_INTERVAL) return;
        lastCleanup = now;
        for (const [key, val] of map) {
            if (now - val._ts > 300_000) map.delete(key); // evict entries older than 5min
        }
    }

    return {
        get(key: string): T | undefined {
            const entry = map.get(key);
            if (!entry) return undefined;
            const { _ts: _, ...value } = entry;
            return value as T;
        },
        set(key: string, value: T) {
            cleanup();
            if (map.size >= maxSize) {
                const firstKey = map.keys().next().value;
                if (firstKey !== undefined) map.delete(firstKey);
            }
            map.set(key, { ...value, _ts: Date.now() } as T & { _ts: number });
        },
        delete(key: string) {
            map.delete(key);
        },
    };
}

const profileCache = createCache<{ isCompleted: boolean; ts: number }>(MAX_CACHE_SIZE);
const roleCache = createCache<{ role: string; ts: number }>(MAX_CACHE_SIZE);
const lastActiveCache = createCache<number>(MAX_CACHE_SIZE);
const PROFILE_CACHE_TTL = 10_000; // 10 seconds — short TTL to avoid stale redirect after onboarding completion
const ROLE_CACHE_TTL = 30_000; // 30 seconds — reduced from 5min to limit stale privilege access
const LAST_ACTIVE_THROTTLE = 300_000; // 5 minutes - update lastActiveAt at most every 5 min

async function getCachedProfileCompleted(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
): Promise<boolean> {
    const cached = profileCache.get(userId);
    if (cached && Date.now() - cached.ts < PROFILE_CACHE_TTL) return cached.isCompleted;

    const { data } = await supabase
        .from('profiles')
        .select('isCompleted')
        .eq('userId', userId)
        .maybeSingle();

    const isCompleted = data?.isCompleted ?? false;
    profileCache.set(userId, { isCompleted, ts: Date.now() });
    return isCompleted;
}

async function getCachedAdminRole(userId: string): Promise<string | null> {
    const cached = roleCache.get(userId);
    if (cached && Date.now() - cached.ts < ROLE_CACHE_TTL) return cached.role;

    const { prisma } = await import('@/lib/prisma');
    const dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });

    const role = dbUser?.role ?? 'user';
    roleCache.set(userId, { role, ts: Date.now() });
    return role;
}

function maybeUpdateLastActive(userId: string) {
    const last = lastActiveCache.get(userId);
    if (last && Date.now() - last < LAST_ACTIVE_THROTTLE) return;
    lastActiveCache.set(userId, Date.now());
    // Fire-and-forget: don't block the request
    import('@/lib/prisma').then(({ prisma }) => {
        prisma.profile.updateMany({
            where: { userId },
            data: { lastActiveAt: new Date() },
        }).catch(() => {});
    }).catch(() => {});
}

export async function middleware(request: NextRequest) {
    const csp = getCSP();

    const requestHeaders = new Headers(request.headers);
    const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

    // updateSession creates its own response with refreshed Supabase cookies.
    // getUser() triggers automatic token refresh if the JWT is expired.
    const { supabaseResponse: response, user } = await updateSession(modifiedRequest);

    // Update lastActiveAt (throttled to once per 5 min per user)
    if (user) {
        maybeUpdateLastActive(user.id);
    }

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
        pathname.startsWith('/chat') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/notifications') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/compatibility') ||
        pathname.startsWith('/matches') ||
        pathname.startsWith('/success-stories') ||
        pathname.startsWith('/refer');

    const isAdminRoute = pathname.startsWith('/admin');
    const isAdminLogin = pathname === '/admin/login';

    const isAuthRoute = pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/password-update') ||
        pathname.startsWith('/auth');

    const isApiRoute = pathname.startsWith('/api/');

    // Public API routes accessible without authentication
    const isPublicApiRoute = pathname.startsWith('/api/public/') ||
        pathname.startsWith('/api/spotify/callback') ||
        pathname.startsWith('/api/lemonsqueezy/webhook') ||
        pathname.startsWith('/api/cron/') ||
        pathname.startsWith('/api/health') ||
        pathname.startsWith('/api/uploadthing');

    if (!user) {
        if (isApiRoute && !isPublicApiRoute) {
            return applySecurityHeaders(NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            ));
        }
        if (isAppRoute && !isAdminLogin) {
            return applySecurityHeaders(NextResponse.redirect(new URL('/login', modifiedRequest.url)));
        }
    }

    if (isAppRoute && user && !isAdminLogin && !isAdminRoute) {
        try {
            const supabase = await createClient(modifiedRequest, response);
            const isCompleted = await getCachedProfileCompleted(supabase, user.id);
            if (!isCompleted) {
                return applySecurityHeaders(NextResponse.redirect(new URL('/onboarding', modifiedRequest.url)));
            }
        } catch {
            // DB error — let the request through rather than redirecting to onboarding
            // which could overwrite existing profile data
        }
    }

    if (isAdminRoute && user && !isAdminLogin) {
        const role = await getCachedAdminRole(user.id);
        if (role !== 'admin' && role !== 'super_admin') {
            return applySecurityHeaders(NextResponse.redirect(new URL('/discover', modifiedRequest.url)));
        }
    }

    const isOnboardingRoute = pathname.startsWith('/onboarding');

    if (isOnboardingRoute && user) {
        try {
            const supabase = await createClient(modifiedRequest, response);
            const isCompleted = await getCachedProfileCompleted(supabase, user.id);
            if (isCompleted) {
                return applySecurityHeaders(NextResponse.redirect(new URL('/discover', modifiedRequest.url)));
            }
        } catch {
            // DB error
        }
    }

    if (isAuthRoute && user && !pathname.startsWith('/auth/callback')) {
        // For other auth routes (login, signup, etc.), redirect completed users to /discover
        try {
            const supabase = await createClient(modifiedRequest, response);
            const isCompleted = await getCachedProfileCompleted(supabase, user.id);
            if (!isCompleted) {
                return applySecurityHeaders(NextResponse.redirect(new URL('/onboarding', modifiedRequest.url)));
            }
        } catch {
            // DB error — let the request through
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/discover', modifiedRequest.url)));
    }

    applySecurityHeaders(response);

    return response;
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
};
