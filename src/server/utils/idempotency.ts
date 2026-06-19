import { prisma } from '@/lib/prisma';

/**
 * Idempotency key middleware for mutation endpoints.
 * Prevents duplicate processing of the same request.
 */

export interface IdempotencyResult {
    ok: boolean;
    status?: number;
    body?: any;
    error?: string;
}

const KEY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Check and consume an idempotency key.
 * Returns the cached response if the key was already used,
 * or claims the key for first-time use.
 */
export async function checkIdempotency(
    key: string,
    userId: string,
    action: string,
): Promise<IdempotencyResult> {
    if (!key) {
        return { ok: true }; // No key, proceed without idempotency
    }

    const existing = await prisma.idempotencyKey.findUnique({
        where: { key_action: { key, action } },
    });

    if (existing) {
        // Key already used — return cached response
        const age = Date.now() - existing.createdAt.getTime();
        if (age > KEY_EXPIRY_MS) {
            // Expired, reclaim it
            await prisma.idempotencyKey.delete({ where: { id: existing.id } });
            await claimIdempotency(key, userId, action);
            return { ok: true };
        }
        return {
            ok: false,
            status: existing.responseStatus || 200,
            body: existing.responseBody,
        };
    }

    // First use — claim it atomically
    const claimed = await claimIdempotency(key, userId, action);
    if (!claimed) {
        // Race condition: another request claimed it first — return the existing response
        const raceExisting = await prisma.idempotencyKey.findUnique({
            where: { key_action: { key, action } },
        });
        if (raceExisting) {
            return {
                ok: false,
                status: raceExisting.responseStatus || 200,
                body: raceExisting.responseBody,
            };
        }
    }
    return { ok: true };
}

async function claimIdempotency(key: string, userId: string, action: string): Promise<boolean> {
    try {
        await prisma.idempotencyKey.create({
            data: { key, userId, action },
        });
        return true;
    } catch (err: any) {
        if (err.code === 'P2002') {
            // Unique constraint violation — another request claimed it
            return false;
        }
        throw err;
    }
}

/**
 * Store the response for an idempotency key after successful processing.
 */
export async function completeIdempotency(
    key: string,
    action: string,
    status: number,
    body: any,
) {
    if (!key) return;
    await prisma.idempotencyKey.update({
        where: { key_action: { key, action } },
        data: { responseStatus: status, responseBody: body },
    }).catch(() => {});
}
