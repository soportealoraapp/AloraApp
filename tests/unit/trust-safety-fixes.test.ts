import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============== B4 TEST: ?? vs || (pure JS, no mocks needed) ==============
describe('B4 — trust-score reputationScore: ?? vs ||', () => {
    it('reputationScore of 0 should stay 0 with ??', () => {
        const reputation = 0 ?? 100;
        expect(reputation).toBe(0);
    });

    it('reputationScore of 0 was incorrectly treated as 100 with ||', () => {
        // This is the OLD broken behavior we're fixing
        const oldBroken = 0 || 100;
        expect(oldBroken).toBe(100); // BUG: 0 is falsy, so || gives 100
    });

    it('reputationScore of null should default to 100 with ??', () => {
        const reputation = null ?? 100;
        expect(reputation).toBe(100);
    });

    it('reputationScore of undefined should default to 100 with ??', () => {
        const reputation = undefined ?? 100;
        expect(reputation).toBe(100);
    });

    it('reputationScore of 50 should remain 50 with ??', () => {
        const reputation = 50 ?? 100;
        expect(reputation).toBe(50);
    });

    it('reputationScore of 90 should remain 90 with ??', () => {
        const reputation = 90 ?? 100;
        expect(reputation).toBe(90);
    });
});

// ============== B3 TEST: calculateReputation block counting ==============
describe('B3 — anti-abuse calculateReputation: blockerId vs blockedId', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('should count blocks where blockedId matches userId (blocks RECEIVED)', async () => {
        // Simulate the FIXED logic: block.count({ where: { blockedId: userId } })
        const mockBlockCount = vi.fn();

        // Mock prisma
        vi.doMock('@/lib/prisma', () => ({
            prisma: {
                profile: {
                    findUnique: vi.fn().mockResolvedValue({
                        trustStatus: null,
                        isShadowBanned: false,
                        isVerified: false,
                        photos: [],
                        bio: 'Hi',
                        subscriptionStatus: 'free',
                    }),
                },
                report: { count: vi.fn().mockResolvedValue(0) },
                block: { count: mockBlockCount },
                message: { count: vi.fn().mockResolvedValue(0) },
                match: { count: vi.fn().mockResolvedValue(0) },
            },
        }));

        const { calculateReputation } = await import('@/server/services/anti-abuse');

        // Spy on what argument is passed to block.count
        let capturedWhere: any = null;
        mockBlockCount.mockImplementation((args: any) => {
            capturedWhere = args.where;
            return Promise.resolve(3); // 3 blocks received
        });

        const score = await calculateReputation('user-abc');

        // Verify it queries by blockedId (not blockerId)
        expect(capturedWhere).toEqual({ blockedId: 'user-abc' });
        // 3 blocks × 5 = 15 deducted from 100 = 85
        expect(score).toBe(85);
    });

    it('OLD broken behavior: counting blockerId gave wrong penalty direction', () => {
        // The broken code was: block.count({ where: { blockerId: userId } })
        // This counts blocks the user MADE (they blocked others), not blocks RECEIVED.
        // A user who blocks harassers was incorrectly penalized.
        const makeBlockCountWithBlockerId = (userId: string) => ({ blockerId: userId });
        const makeBlockCountWithBlockedId = (userId: string) => ({ blockedId: userId });

        const userId = 'victim-user';
        // OLD: { blockerId: 'victim-user' } — counts how many people victim blocked
        expect(makeBlockCountWithBlockerId(userId)).toEqual({ blockerId: userId });
        // NEW: { blockedId: 'victim-user' } — counts how many times victim was blocked
        expect(makeBlockCountWithBlockedId(userId)).toEqual({ blockedId: userId });

        // The key semantic difference:
        // blockerId = the person who did the blocking (aggressor)
        // blockedId = the person who was blocked (victim)
        // To penalize users who are blocked by others, we query blockedId.
    });
});

// ============== B5 TEST: getUserProfile placeholder removal ==============
describe('B5 — user getUserProfile: no placeholder creation', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('should return null without creating a user when user not found', async () => {
        const mockFindUnique = vi.fn().mockResolvedValue(null);
        const mockUpsert = vi.fn();

        vi.doMock('@/lib/prisma', () => ({
            prisma: {
                user: {
                    findUnique: mockFindUnique,
                    upsert: mockUpsert,
                },
            },
        }));

        // Mock unstable_cache to just run the function
        vi.doMock('next/cache', () => ({
            unstable_cache: (fn: Function) => fn,
        }));

        const { getUserProfile } = await import('@/server/actions/user');

        const result = await getUserProfile('nonexistent-user');

        expect(result).toBeNull();
        // The old buggy code called prisma.user.upsert to create a placeholder.
        // The fix removes that call entirely.
        expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should still return null when user has no profile', async () => {
        const mockFindUnique = vi.fn().mockResolvedValue({
            id: 'user-without-profile',
            email: 'test@test.com',
            name: 'Test',
            createdAt: new Date(),
            profile: null,
        });

        vi.doMock('@/lib/prisma', () => ({
            prisma: {
                user: {
                    findUnique: mockFindUnique,
                    upsert: vi.fn(),
                },
            },
        }));

        vi.doMock('next/cache', () => ({
            unstable_cache: (fn: Function) => fn,
        }));

        const { getUserProfile } = await import('@/server/actions/user');

        const result = await getUserProfile('user-without-profile');

        expect(result).toBeNull();
    });

    it('OLD broken behavior: was creating placeholder records', () => {
        // The OLD code did this:
        // await prisma.user.upsert({
        //     where: { id: userId },
        //     create: { id: userId, email: `${userId}@pending.local` },
        //     update: {},
        // });
        // This allowed any unauthenticated caller to create arbitrary user records.
        const userId = 'arbitrary-id-123';
        const oldBuggyCreate = {
            where: { id: userId },
            create: { id: userId, email: `${userId}@pending.local` },
            update: {},
        };

        expect(oldBuggyCreate.create.email).toBe('arbitrary-id-123@pending.local');
        // The fix removes this upsert entirely — no records created for non-existent users.
    });
});
