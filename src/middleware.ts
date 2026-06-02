import { NextResponse, NextRequest } from 'next/server';
import { updateSession, createClient } from '@/lib/supabase/middleware';
import { getCSP, SECURITY_HEADERS } from '@/lib/security';

const BETA_EXEMPT_PREFIXES = [
    '/login',
    '/signup',
    '/forgot-password',
    '/password-update',
    '/auth',
    '/launch',
    '/api/auth',
    '/api/waitlist',
    '/api/beta-codes',
    '/api/health',
    '/api/lemonsqueezy',
    '/api/stripe',
    '/waitlist',
    '/privacy',
    '/terms',
    '/partners',
    '/community',
    '/_next',
    '/favicon',
    '/manifest',
    '/sw',
    '/icons',
];

const BETA_EXEMPT_EXACT = new Set([
    '/launch',
    '/waitlist',
    '/privacy',
    '/terms',
]);

function isBetaExempt(pathname: string): boolean {
    if (BETA_EXEMPT_EXACT.has(pathname)) return true;
    return BETA_EXEMPT_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

const betaAccessCache = new Map<string, { value: boolean; expiresAt: number }>();
const BETA_CACHE_TTL = 60_000;

async function checkBetaAccess(userId: string, request: NextRequest, response: NextResponse): Promise<boolean> {
    if (!userId) return false;

    const now = Date.now();
    const cached = betaAccessCache.get(userId);
    if (cached && cached.expiresAt > now) return cached.value;

    const supabase = await createClient(request, response);
    const { data: user } = await supabase
        .from('users')
        .select('isBetaUser, role, isActive')
        .eq('id', userId)
        .single();

    if (!user || !user.isActive) {
        betaAccessCache.set(userId, { value: false, expiresAt: now + BETA_CACHE_TTL });
        return false;
    }

    if (user.role === 'admin' || user.role === 'moderator') {
        betaAccessCache.set(userId, { value: true, expiresAt: now + BETA_CACHE_TTL });
        return true;
    }

    const hasAccess = user.isBetaUser === true;
    betaAccessCache.set(userId, { value: hasAccess, expiresAt: now + BETA_CACHE_TTL });
    return hasAccess;
}

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
        pathname.startsWith('/support') ||
        pathname.startsWith('/compatibility') ||
        pathname.startsWith('/match') ||
        pathname.startsWith('/stories') ||
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

    // BETA ACCESS: gate app routes behind beta access
    if (isAppRoute && user && !isBetaExempt(pathname)) {
        const allowed = await checkBetaAccess(user.id, modifiedRequest, response);
        if (!allowed) {
            return NextResponse.redirect(new URL('/waitlist', modifiedRequest.url));
        }
    }

    if (isAdminRoute && user) {
        const supabaseClient = await createClient(modifiedRequest, response);
        const { data: profile } = await supabaseClient
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'moderator')) {
            return NextResponse.redirect(new URL('/waitlist', modifiedRequest.url));
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
