import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('[STRIPE] STRIPE_SECRET_KEY is not set. Payments will not work.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    typescript: true,
});
