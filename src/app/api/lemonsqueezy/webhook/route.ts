import { NextResponse } from 'next/server';
import { handlePaymentSuccess, handleSubscriptionCancel } from '@/lib/lemonsqueezy/actions';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        // Read raw body first for HMAC verification (must be before json parsing)
        const rawBody = await request.text();
        const body = JSON.parse(rawBody);
        const event = body.meta?.event_name;

        // Verify webhook signature (HMAC-SHA256)
        const signature = request.headers.get('x-signature');
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
        if (!secret) {
            console.error('[webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
            return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
        }
        if (!signature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }
        const crypto = await import('crypto');
        const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
        const sigBuf = Buffer.from(signature, 'utf8');
        const expBuf = Buffer.from(expected, 'utf8');
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const customData = body.meta?.custom_data || {};
        const userId = customData.user_id;

        if (!userId) {
            return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 });
        }

        // Validate that the user actually exists before processing payment
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!existingUser) {
            console.warn(`[webhook] User ${userId} not found — ignoring event`);
            return NextResponse.json({ received: true, ignored: true });
        }

        switch (event) {
            case 'order_created':
            case 'subscription_created':
            case 'subscription_updated': {
                const status = body.data?.attributes?.status;
                if (status === 'active') {
                    const subscriptionId = body.data?.id;
                    await handlePaymentSuccess(userId, subscriptionId);
                }
                break;
            }

            case 'subscription_cancelled':
            case 'subscription_expired': {
                await handleSubscriptionCancel(userId);
                break;
            }

            default:
                // Unhandled event type
                break;
        }

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
