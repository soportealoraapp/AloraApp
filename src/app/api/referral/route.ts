import { NextResponse } from 'next/server';
import { redeemReferral } from '@/server/actions/referral';
import { withRateLimit } from '@/server/utils/api-rate-limit';

export async function POST(request: Request) {
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ ok: false, reason: 'invalid_body' }, { status: 400 });
    }

    // Rate limit referral redemption attempts
    const code = typeof body === 'object' && body !== null && 'code' in body
        ? String((body as { code?: unknown }).code ?? '')
        : '';

    // Use code as rate limit key to prevent brute-force
    if (code) {
        const rateLimitResponse = await withRateLimit(`referral:${code}`, 'referral');
        if (rateLimitResponse) return rateLimitResponse;
    }

    const result = await redeemReferral(code);

    if (result.ok) {
        return NextResponse.json({ ok: true });
    }

    const status =
        result.reason === 'unauthenticated' ? 401 :
        result.reason === 'already_redeemed' ? 409 :
        result.reason === 'self_referral' ? 403 :
        400;

    return NextResponse.json({ ok: false, reason: result.reason }, { status });
}
