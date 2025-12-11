import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? 'sk_test_placeholder', {
    apiVersion: '2024-11-20.acacia', // Latest stable API version as of late 2024/2025
    typescript: true,
});
