'use server';

import { prisma } from '@/lib/prisma';

/**
 * Check if a user/key is rate limited.
 * Uses a fixed window counter strategy in DB with atomic operations.
 * @param key Unique key (userId_action or ip_action)
 * @param limit Max requests allowed in the window
 * @param windowSeconds Duration of the window in seconds
 */
export async function checkRateLimit(key: string, limit: number = 10, windowSeconds: number = 60): Promise<boolean> {
    try {
        const now = new Date();

        // Try to increment existing non-expired row atomically
        const updated = await prisma.$executeRaw`
            UPDATE "rate_limits"
            SET "count" = "count" + 1
            WHERE "key" = ${key}
              AND "lastReset" > ${new Date(now.getTime() - windowSeconds * 1000)}
        `;

        if (updated > 0) {
            // Row existed and window hasn't expired — read the new count
            const rows = await prisma.$queryRaw<[{ count: number }]>`
                SELECT "count" FROM "rate_limits" WHERE "key" = ${key} LIMIT 1
            `;
            return (rows[0]?.count ?? 0) <= limit;
        }

        // No active window — upsert to create or reset atomically
        await prisma.$executeRaw`
            INSERT INTO "rate_limits" ("id", "key", "count", "lastReset")
            VALUES (gen_random_uuid()::text, ${key}, 1, ${now})
            ON CONFLICT ("key")
            DO UPDATE SET "count" = 1, "lastReset" = ${now}
        `;

        return true; // count=1, always within limit
    } catch (error) {
        console.error('Rate limit error', error);
        return false;
    }
}
