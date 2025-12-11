import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { adminAuth } from '@/server/firebase/admin';
import { PLANS } from '@/lib/domain/subscription';

export async function POST(req: Request) {
    try {
        const { plan, userId } = await req.json();

        // Validate User (optional double check)
        // const user = await adminAuth.getUser(userId);

        const priceId = PLANS[plan as keyof typeof PLANS]?.id;
        if (!priceId) return NextResponse.json({ error: 'Invalid Plan' }, { status: 400 });

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId, // In Test mode this needs to be a valid price ID from Stripe Dashboard
                    quantity: 1,
                },
            ],
            metadata: {
                userId,
                plan
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription?canceled=true`,
        });

        return NextResponse.json({ sessionId: session.id, url: session.url });
    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
