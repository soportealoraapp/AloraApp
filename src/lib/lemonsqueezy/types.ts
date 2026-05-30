export interface LemonSqueezySubscription {
    id: string;
    storeId: string;
    customerId: string;
    orderId: string;
    productId: string;
    variantId: string;
    productName: string;
    variantName: string;
    status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'paused';
    renewsAt: string | null;
    endsAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface LemonSqueezyCustomer {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export const PLAN_VARIANTS: Record<string, { variantId: string; name: string; price: number }> = {
    plus: {
        variantId: process.env.LEMON_SQUEEZY_PLUS_VARIANT_ID || '',
        name: 'Alora+',
        price: 99,
    },
};
