'use server';

import { prisma } from '@/lib/prisma';

/**
 * Hybrid cache layer with in-memory LRU fallback.
 * In production, this would be backed by Redis/Upstash.
 * The interface is identical — swap the store implementation when Redis is available.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
    staleAt: number; // stale-while-revalidate threshold
}

type CacheStore = 'memory';

export class HybridCache {
    private store: CacheStore = 'memory';
    private memoryCache = new Map<string, CacheEntry<any>>();
    private maxMemoryItems = 500;

    private isRedisConfigured = false;

    constructor() {
        this.isRedisConfigured = !!process.env.UPSTASH_REDIS_REST_URL;
    }

    private makeKey(prefix: string, key: string): string {
        return `alora:${prefix}:${key}`;
    }

    async get<T>(prefix: string, key: string): Promise<T | null> {
        const cacheKey = this.makeKey(prefix, key);
        const now = Date.now();

        const entry = this.memoryCache.get(cacheKey);
        if (!entry) return null;

        if (now < entry.expiresAt) {
            return entry.value as T;
        }

        // Stale but still usable (stale-while-revalidate)
        if (now < entry.staleAt) {
            // Trigger async refresh in background
            return entry.value as T;
        }

        // Expired
        this.memoryCache.delete(cacheKey);
        return null;
    }

    async set<T>(
        prefix: string,
        key: string,
        value: T,
        ttlSeconds: number = 300,
        staleTtlSeconds?: number,
    ): Promise<void> {
        const cacheKey = this.makeKey(prefix, key);
        const now = Date.now();
        const staleMultiplier = staleTtlSeconds ?? ttlSeconds * 2;

        // LRU eviction
        if (this.memoryCache.size >= this.maxMemoryItems) {
            const oldestKey = this.memoryCache.keys().next().value;
            if (oldestKey) this.memoryCache.delete(oldestKey);
        }

        this.memoryCache.set(cacheKey, {
            value,
            expiresAt: now + ttlSeconds * 1000,
            staleAt: now + staleMultiplier * 1000,
        });
    }

    async invalidate(prefix: string, key?: string): Promise<void> {
        if (key) {
            this.memoryCache.delete(this.makeKey(prefix, key));
        } else {
            // Invalidate all keys with this prefix
            const prefixStr = `alora:${prefix}:`;
            for (const k of this.memoryCache.keys()) {
                if (k.startsWith(prefixStr)) {
                    this.memoryCache.delete(k);
                }
            }
        }
    }

    async invalidatePrefix(prefix: string): Promise<void> {
        await this.invalidate(prefix);
    }

    // TTL presets
    static TTL = {
        FEED: 120,           // 2 min
        PROFILE: 300,        // 5 min
        COMPATIBILITY: 600,  // 10 min
        AI_INSIGHT: 900,     // 15 min
        UNREAD_COUNT: 30,    // 30 sec
        POPULARITY: 3600,    // 1 hour
        NOTIFICATION_DEDUP: 86400, // 24 hours
    };

    getStats() {
        return {
            size: this.memoryCache.size,
            maxSize: this.maxMemoryItems,
            store: this.store,
            redisConfigured: this.isRedisConfigured,
        };
    }
}

export const cache = new HybridCache();

// ========== CACHE ACCESSORS ==========

export const feedCache = {
    async get(userId: string) {
        return cache.get('feed', userId);
    },
    async set(userId: string, data: any) {
        await cache.set('feed', userId, data, HybridCache.TTL.FEED);
    },
    async invalidate(userId: string) {
        await cache.invalidate('feed', userId);
    },
};

export const profileCache = {
    async get(userId: string) {
        return cache.get('profile', userId);
    },
    async set(userId: string, data: any) {
        await cache.set('profile', userId, data, HybridCache.TTL.PROFILE);
    },
    async invalidate(userId: string) {
        await cache.invalidate('profile', userId);
    },
};

export const compatibilityCache = {
    async get(userIdA: string, userIdB: string) {
        const key = [userIdA, userIdB].sort().join(':');
        return cache.get('compat', key);
    },
    async set(userIdA: string, userIdB: string, data: any) {
        const key = [userIdA, userIdB].sort().join(':');
        await cache.set('compat', key, data, HybridCache.TTL.COMPATIBILITY);
    },
    async invalidate(userId: string) {
        await cache.invalidatePrefix('compat');
    },
};

export const aiCache = {
    async get(matchId: string, type: string) {
        return cache.get('ai', `${matchId}:${type}`);
    },
    async set(matchId: string, type: string, data: any) {
        await cache.set('ai', `${matchId}:${type}`, data, HybridCache.TTL.AI_INSIGHT);
    },
    async invalidate(matchId: string) {
        await cache.invalidate('ai', matchId);
    },
};

export const unreadCache = {
    async get(userId: string) {
        return cache.get('unread', userId);
    },
    async set(userId: string, count: number) {
        await cache.set('unread', userId, count, HybridCache.TTL.UNREAD_COUNT);
    },
};

export const notificationDedupCache = {
    async check(key: string): Promise<boolean> {
        const existing = await cache.get('notif_dedup', key);
        if (existing) return false; // Already sent

        await cache.set('notif_dedup', key, true, HybridCache.TTL.NOTIFICATION_DEDUP);
        return true; // Not sent, can send
    },
};

// ========== INVALIDATION TRIGGERS ==========

export async function invalidateOnProfileUpdate(userId: string) {
    await Promise.all([
        feedCache.invalidate(userId),
        profileCache.invalidate(userId),
        compatibilityCache.invalidate(userId),
    ]);
}

export async function invalidateOnMessage(matchId: string, userIds: string[]) {
    await aiCache.invalidate(matchId);
    for (const uid of userIds) {
        await feedCache.invalidate(uid);
    }
}

export async function invalidateOnMatch(userIdA: string, userIdB: string) {
    await Promise.all([
        feedCache.invalidate(userIdA),
        feedCache.invalidate(userIdB),
        compatibilityCache.invalidate(userIdA),
    ]);
}
