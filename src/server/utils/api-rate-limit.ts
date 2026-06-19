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
    ai: { limit: 10, windowSeconds: 60 },
    spotify: { limit: 10, windowSeconds: 60 },
};

export async function withRateLimit(userId: string, action: keyof typeof LIMITS): Promise<NextResponse | null> {
    const config = LIMITS[action];
    if (!config) return null;

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
