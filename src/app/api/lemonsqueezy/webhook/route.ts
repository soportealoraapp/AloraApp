import { NextResponse } from 'next/server';
import { handlePaymentSuccess, handleSubscriptionCancel } from '@/lib/lemonsqueezy/actions';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = body.meta?.event_name;

        // Verify webhook signature (basic check)
        const signature = request.headers.get('x-signature');
        const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
        if (secret && signature !== secret) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const customData = body.meta?.custom_data || {};
        const userId = customData.user_id;

        if (!userId) {
            return NextResponse.json({ error: 'No user_id in custom_data' }, { status: 400 });
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
