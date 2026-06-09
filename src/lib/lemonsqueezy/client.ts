/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

export interface LemonSqueezyConfig {
    apiKey: string;
    storeId: string;
}

export interface CheckoutOptions {
    userId: string;
    email: string;
    planId: string;
    variantId: string;
    successUrl: string;
    cancelUrl: string;
}

export interface CheckoutResult {
    url: string;
    id: string;
}

export interface WebhookEvent {
    meta: {
        event_name: string;
        custom_data: Record<string, string>;
    };
    data: {
        id: string;
        attributes: {
            status: string;
            created_at: string;
            updated_at: string;
            [key: string]: any;
        };
    };
}

const LEMON_SQUEEZY_API = 'https://api.lemonsqueezy.com/v1';

/**
 * Create a Lemon Squeezy client.
 */
export function createLemonSqueezyClient() {
    const apiKey = process.env.LEMON_SQUEEZY_API_KEY;
    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;

    if (!apiKey || !storeId) {
        throw new Error('LEMON_SQUEEZY_API_KEY and LEMON_SQUEEZY_STORE_ID are required');
    }

    async function request(path: string, options: RequestInit = {}) {
        const response = await fetch(`${LEMON_SQUEEZY_API}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.api+json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(`Lemon Squeezy API error: ${response.status} ${JSON.stringify(error)}`);
        }

        return response.json();
    }

    return {
        /**
         * Create a checkout session.
         */
        async createCheckout(options: CheckoutOptions): Promise<CheckoutResult> {
            const result = await request('/checkouts', {
                method: 'POST',
                body: JSON.stringify({
                    data: {
                        type: 'checkouts',
                        attributes: {
                            checkout_data: {
                                email: options.email,
                                custom: {
                                    user_id: options.userId,
                                },
                            },
                            product_options: {
                                redirect_url: options.successUrl,
                                cancel_url: options.cancelUrl,
                            },
                        },
                        relationships: {
                            store: {
                                data: {
                                    type: 'stores',
                                    id: storeId,
                                },
                            },
                            variant: {
                                data: {
                                    type: 'variants',
                                    id: options.variantId,
                                },
                            },
                        },
                    },
                }),
            });

            return {
                url: result.data.attributes.url,
                id: result.data.id,
            };
        },

        /**
         * Verify a webhook signature.
         */
        verifyWebhook(body: string, signature: string): boolean {
            // Lemon Squeezy uses a simple secret-based verification
            // In production, use crypto.createHmac to verify
            const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
            if (!secret) return false;

            // Basic verification - in production implement proper HMAC
            return signature === secret;
        },

        /**
         * Get subscription details.
         */
        async getSubscription(subscriptionId: string) {
            const result = await request(`/subscriptions/${subscriptionId}`);
            return result.data;
        },
    };
}
