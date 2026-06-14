'use server';

import { prisma } from '@/lib/prisma';
import { addSeconds, isAfter } from 'date-fns';

/**
 * Check if a user/key is rate limited.
 * Uses a fixed window counter strategy in DB.
 * @param key Unique key (userId_action or ip_action)
 * @param limit Max requests allowed in the window
 * @param windowSeconds Duration of the window in seconds
 */
export async function checkRateLimit(key: string, limit: number = 10, windowSeconds: number = 60): Promise<boolean> {
    try {
        const now = new Date();

        // Atomic upsert: create or increment in a single query
        const rateLimit = await prisma.rateLimit.upsert({
            where: { key },
            create: { key, count: 1, lastReset: now },
            update: { count: { increment: 1 } },
        });

        const resetTime = addSeconds(rateLimit.lastReset, windowSeconds);

        if (isAfter(now, resetTime)) {
            // Window complete, reset count
            await prisma.rateLimit.update({
                where: { key },
                data: { count: 1, lastReset: now },
            });
            return true;
        }

        return rateLimit.count <= limit;
    } catch (error) {
        console.error('Rate limit error', error);
        return false;
    }
}
