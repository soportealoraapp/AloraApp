import { checkRateLimit } from './rate-limit';
import { NextResponse } from 'next/server';

const LIMITS: Record<string, { limit: number; windowSeconds: number }> = {
    like: { limit: 30, windowSeconds: 60 },
    send: { limit: 20, windowSeconds: 60 },
    profileUpdate: { limit: 5, windowSeconds: 60 },
    upload: { limit: 10, windowSeconds: 60 },
    auth: { limit: 5, windowSeconds: 60 },
    block: { limit: 10, windowSeconds: 60 },
    report: { limit: 10, windowSeconds: 60 },
    rewind: { limit: 5, windowSeconds: 60 },
    boost: { limit: 5, windowSeconds: 60 },
    referral: { limit: 5, windowSeconds: 60 },
    analytics: { limit: 30, windowSeconds: 60 },
    passedRead: { limit: 30, windowSeconds: 60 },
    ai: { limit: 10, windowSeconds: 60 },
    spotify: { limit: 10, windowSeconds: 60 },
    adminAction: { limit: 30, windowSeconds: 60 },
    profileView: { limit: 60, windowSeconds: 60 },
    profileRead: { limit: 30, windowSeconds: 60 },
    matchFeed: { limit: 30, windowSeconds: 60 },
    reaction: { limit: 30, windowSeconds: 60 },
    notification: { limit: 30, windowSeconds: 60 },
    match: { limit: 30, windowSeconds: 60 },
    feedback: { limit: 10, windowSeconds: 60 },
    discover: { limit: 30, windowSeconds: 60 },
    deleteAccount: { limit: 3, windowSeconds: 60 },
    blockRead: { limit: 30, windowSeconds: 60 },
    streakCheckin: { limit: 5, windowSeconds: 60 },
    publicStats: { limit: 30, windowSeconds: 60 },
    checkout: { limit: 5, windowSeconds: 60 },
};

export async function withRateLimit(userId: string, action: keyof typeof LIMITS): Promise<NextResponse | null> {
    const config = LIMITS[action];
    if (!config) {
        console.error(`withRateLimit: unknown action "${action}" — blocking request as safety measure`);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }

    const key = `${userId}_${action}`;
    const allowed = await checkRateLimit(key, config.limit, config.windowSeconds);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Por favor, espera un momento.' },
            { status: 429 }
        );
    }
    return null;
}

/**
 * Rate limit by IP address — for endpoints that may not have a userId yet.
 */
export async function withIpRateLimit(ip: string, action: keyof typeof LIMITS): Promise<NextResponse | null> {
    const config = LIMITS[action];
    if (!config) {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }

    const key = `ip_${ip}_${action}`;
    const allowed = await checkRateLimit(key, config.limit, config.windowSeconds);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Demasiadas solicitudes. Por favor, espera un momento.' },
            { status: 429 }
        );
    }
    return null;
}
