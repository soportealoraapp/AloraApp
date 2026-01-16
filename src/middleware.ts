import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter for Edge
const rateLimitMap = new Map();

function rateLimit(ip: string, limit: number, windowMs: number) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Cleanup old entries
    if (Math.random() < 0.1) { // 10% chance to cleanup to save ops
        for (const [key, value] of rateLimitMap.entries()) {
            if (value.timestamp < windowStart) rateLimitMap.delete(key);
        }
    }

    const record = rateLimitMap.get(ip) || { count: 0, timestamp: now };

    if (record.timestamp < windowStart) {
        record.count = 1;
        record.timestamp = now;
    } else {
        record.count += 1;
    }

    rateLimitMap.set(ip, record);
    return record.count <= limit;
}

export async function middleware(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // 1. Rate Limiting (Hardening)
    // 100 requests per minute
    if (!rateLimit(ip, 100, 60 * 1000)) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const session = request.cookies.get('__session');

    // 2. Auth Check
    if (!session && request.nextUrl.pathname.startsWith('/app')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    const response = NextResponse.next();

    // 3. Security Headers (Helmet-like)
    const csp = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
        style-src 'self' 'unsafe-inline';
        img-src 'self' blob: data: https://lh3.googleusercontent.com;
        font-src 'self' data:;
        connect-src 'self' https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://firestore.googleapis.com;
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
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
