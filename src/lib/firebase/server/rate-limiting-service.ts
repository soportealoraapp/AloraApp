import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type RateCategory = 'safety' | 'social' | 'growth' | 'auth';

export interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
}

const CATEGORY_CONFIG: Record<RateCategory, RateLimitConfig> = {
    auth: { maxRequests: 5, windowSeconds: 60 },      // 5 attempts per minute
    safety: { maxRequests: 50, windowSeconds: 3600 },  // 50 reports per hour
    social: { maxRequests: 100, windowSeconds: 300 },  // 100 messages per 5 mins
    growth: { maxRequests: 10, windowSeconds: 3600 }   // 10 invites per hour
};

export const rateLimitingServerService = {
    async checkAndIncrement(userId: string, category: RateCategory): Promise<{ allowed: boolean; remaining: number }> {
        const config = CATEGORY_CONFIG[category];
        const bucketRef = adminDb.collection('rate_limits').doc(`${userId}_${category}`);
        const now = Date.now();
        const windowStart = now - (config.windowSeconds * 1000);

        return adminDb.runTransaction(async (transaction) => {
            const bucketDoc = await transaction.get(bucketRef);
            let data = bucketDoc.data() || { requests: [] };

            // Cleanup old requests
            const activeRequests = (data.requests as any[]).filter(req => req.timestamp > windowStart);

            if (activeRequests.length >= config.maxRequests) {
                return { allowed: false, remaining: 0 };
            }

            // Increment
            activeRequests.push({ timestamp: now });
            transaction.set(bucketRef, { requests: activeRequests });

            return { allowed: true, remaining: config.maxRequests - activeRequests.length };
        });
    }
};
