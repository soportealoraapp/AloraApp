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

        // Upsert logic: get existing or create new
        // Note: Concurrency might be an issue for strict limits, but acceptable for this use case
        const rateLimit = await prisma.rateLimit.findUnique({
            where: { key },
        });

        if (!rateLimit) {
            await prisma.rateLimit.create({
                data: {
                    key,
                    count: 1,
                    lastReset: now,
                },
            });
            return true;
        }

        const resetTime = addSeconds(rateLimit.lastReset, windowSeconds);

        if (isAfter(now, resetTime)) {
            // Window complete, reset
            await prisma.rateLimit.update({
                where: { key },
                data: {
                    count: 1,
                    lastReset: now,
                },
            });
            return true;
        } else {
            // Within window
            if (rateLimit.count >= limit) {
                return false; // Limited
            }

            await prisma.rateLimit.update({
                where: { key },
                data: {
                    count: rateLimit.count + 1,
                },
            });
            return true;
        }
    } catch (error) {
        console.error('Rate limit error', error);
        // Fail open in case of DB error (don't block users if cache/db down)
        return true;
    }
}
