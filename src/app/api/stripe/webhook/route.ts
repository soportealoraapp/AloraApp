import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createSubscription } from '@/server/actions/subscriptions';
import { headers } from 'next/headers'; // Correct usage requires awaiting in next 15 but this is route handler

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET ?? '');
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;

        if (userId && plan) {
            await createSubscription(userId, plan, session.subscription as string);
        }
    }

    return NextResponse.json({ received: true });
}
