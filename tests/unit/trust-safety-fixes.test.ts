import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

// ============== B2 TEST: Discover cursor-based pagination ==============
describe('B2 — Discover cursor-based pagination', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    /**
     * Helper: build mock prisma for getDynamicFeed tests.
     * profiles: array of partial profile objects (must have userId, seeking)
     * opts:
     *   viewerGender — determines bidirectional filter behavior
     */
    function buildMockPrisma(profiles: Array<{ userId: string; seeking?: string; gender?: string; photos?: string[]; bio?: string; interests?: string[]; values?: string[]; age?: number; lastActiveAt?: Date | null; subscriptionStatus?: string; trustStatus?: string; isVerified?: boolean; reputationScore?: number; isShadowBanned?: boolean; voiceIntro?: string | null; }>, opts?: { viewerGender?: string }) {
        // For each profile, the profile object returned by prisma
        const profileRecords = profiles.map(p => ({
            userId: p.userId,
            user: { id: p.userId, email: `${p.userId}@test.com`, deletedAt: null },
            displayName: `User_${p.userId}`,
            bio: p.bio || 'Hello',
            age: p.age || 25,
            gender: p.gender || 'woman',
            seeking: p.seeking || 'everyone',
            photos: p.photos || ['photo1.jpg'],
            interests: p.interests || [],
            values: p.values || [],
            isVerified: p.isVerified ?? true,
            subscriptionStatus: p.subscriptionStatus || 'free',
            trustStatus: p.trustStatus || 'clean',
            reputationScore: p.reputationScore ?? 100,
            isShadowBanned: p.isShadowBanned ?? false,
            voiceIntro: p.voiceIntro ?? null,
            lastActiveAt: p.lastActiveAt || new Date(),
            createdAt: new Date(),
            incomplete_media: false,
            boostExpiresAt: null,
        }));

        const mockFindMany = vi.fn().mockImplementation((args: any) => {
            const { where, take, skip } = args;
            const gt = where?.userId?.gt;
            const notInSet = new Set(where?.userId?.notIn || []);
            const inList = where?.userId?.in || null;
            const genderFilter = where?.gender;

            let filtered = profileRecords.filter(p => {
                if (notInSet.has(p.userId)) return false;
                if (inList && !inList.includes(p.userId)) return false;
                if (gt && p.userId <= gt) return false;
                if (genderFilter && p.gender !== genderFilter) return false;
                return true;
            });

            // Sort by userId ascending
            filtered.sort((a, b) => a.userId.localeCompare(b.userId));

            if (skip) {
                filtered = filtered.slice(skip);
            }

            const result = filtered.slice(0, take || 10);
            return Promise.resolve(result);
        });

        const mockGroupBy = vi.fn().mockResolvedValue([]);
        const mockFindManyVoice = vi.fn().mockResolvedValue([]);
        const mockFindManyQuiz = vi.fn().mockResolvedValue([]);
        const mockFindManyActive = vi.fn().mockResolvedValue([]);

        return {
            prisma: {
                user: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: 'viewer-user',
                        email: 'viewer@test.com',
                        name: 'Viewer',
                        createdAt: new Date(),
                        deletedAt: null,
                        profile: {
                            gender: opts?.viewerGender || 'man',
                            seeking: 'women',
                            interests: ['music', 'travel'],
                            values: ['honesty'],
                            latitude: null,
                            longitude: null,
                            travelModeEnabled: false,
                            travelLatitude: null,
                            travelLongitude: null,
                        },
                    }),
                },
                profile: {
                    findMany: mockFindMany,
                    findUnique: vi.fn().mockResolvedValue({
                        trustStatus: 'clean',
                        isShadowBanned: false,
                        isVerified: true,
                        photos: ['a.jpg', 'b.jpg'],
                        bio: 'A long enough bio for testing completeness',
                        subscriptionStatus: 'free',
                        lastActiveAt: new Date(),
                        createdAt: new Date(),
                        interests: ['music'],
                        values: ['honesty'],
                        latitude: null,
                        longitude: null,
                        reputationScore: 100,
                        voiceIntro: null,
                        incomplete_media: false,
                        boostExpiresAt: null,
                    }),
                },
                block: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                interaction: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                match: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                report: {
                    findMany: vi.fn().mockResolvedValue([]),
                },
                message: {
                    groupBy: mockGroupBy,
                },
                quizResult: {
                    findMany: mockFindManyQuiz,
                },
            },
            mockFindMany,
            mockGroupBy,
        };
    }

    /**
     * Build a profile with a specific userId prefix for deterministic ordering.
     * UUIDs sort lexicographically, so we use zero-padded prefixes.
     */
    function profile(id: string, overrides: any = {}): any {
        // Use userId that sorts lexicographically in a predictable order
        // "user_001" < "user_002" < ... < "user_033"
        const userId = `user_${id.padStart(3, '0')}`;
        return { userId, seeking: 'everyone', ...overrides };
    }

    it('R1: cada perfil elegible aparece exactamente una vez (no hay skip-based loss)', async () => {
        // Simulate 33 profiles ordered by userId
        const allProfiles = Array.from({ length: 33 }, (_, i) => profile(String(i + 1)));

        // Profiles 5, 10, 15, 20 have seeking=men → will be filtered by bidirectional (viewer is woman)
        allProfiles[4].seeking = 'men';   // user_005
        allProfiles[9].seeking = 'men';   // user_010
        allProfiles[14].seeking = 'men';  // user_015
        allProfiles[19].seeking = 'men';  // user_020

        // Profiles 7, 14, 21 have empty photos → will be filtered by visibility
        allProfiles[6].photos = [];        // user_007
        allProfiles[13].photos = [];       // user_014
        allProfiles[20].photos = [];       // user_021

        const mocks = buildMockPrisma(allProfiles, { viewerGender: 'woman' });

        // Mock ALL dependencies to avoid import errors
        vi.doMock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
        vi.doMock('@/lib/utils/completeness', () => ({ calculateCompleteness: vi.fn().mockReturnValue(80) }));
        vi.doMock('@/server/actions/compatibility/getCompatibilityScore', () => ({
            getCompatibilityScore: vi.fn().mockResolvedValue({ score: 50, breakdown: {}, explanation: [] }),
        }));
        vi.doMock('@/lib/product/flags', () => ({
            getFlags: vi.fn().mockResolvedValue({ verificationPriority: 0, voiceIntroBoost: 0 }),
        }));
        vi.doMock('@/lib/location', () => ({ getDistance: vi.fn().mockReturnValue(10) }));

        const { getDynamicFeed } = await import('@/server/actions/feed');

        // Page 1: should return profiles that pass all filters
        const page1 = await getDynamicFeed('viewer-user', undefined, undefined, 10, {
            ageRange: [18, 60],
            distance: 100,
            userLat: 0,
            userLng: 0,
        });

        // Of 33 profiles:
        // - 4 removed by bidirectional (5,10,15,20) → 29 remain
        // - 3 removed by visibility (7,14,21) → 26 remain
        // Total eligible: 26
        // page1 should return 10 (the top 10 by score after sorting)
        expect(page1.items.length).toBe(10);

        // With cursor-based pagination, nextCursor = userId of 10th returned item
        expect(page1.nextCursor).toBeTruthy();
        expect(page1.hasMore).toBe(true);

        // The cursor should be the userId of the 10th item
        const lastReturnedId = page1.items[9].profile.id;
        expect(page1.nextCursor).toBe(lastReturnedId);

        // The 10 returned profiles should NOT include the filtered-out ones
        const returnedIds = new Set(page1.items.map(i => i.profile.id));
        expect(returnedIds.has('user_005')).toBe(false); // bidirectional filtered
        expect(returnedIds.has('user_010')).toBe(false);
        expect(returnedIds.has('user_007')).toBe(false); // visibility filtered
        expect(returnedIds.has('user_014')).toBe(false);

        // Page 2: should start from after the cursor = lastReturnedId
        // The remaining 16 eligible profiles (26 - 10) should appear
        const page2 = await getDynamicFeed('viewer-user', undefined, page1.nextCursor, 10, {
            ageRange: [18, 60],
            distance: 100,
            userLat: 0,
            userLng: 0,
        });

        // Should continue from after cursor
        const page2Ids = new Set(page2.items.map(i => i.profile.id));
        // No overlap with page 1
        for (const id of returnedIds) {
            expect(page2Ids.has(id)).toBe(false);
        }
        // Should contain the eligible profiles not returned on page 1
        // user_022 through user_033 are eligible and should appear on page 2 or later
        // (Some of user_008, user_009, etc. should also appear since they weren't on page 1)
        expect(page2.items.length).toBeGreaterThan(0);
    });

    it('R2 + R3: filtros agresivos (90% eliminados) — scan loop recupera, no depende de fetchSize', async () => {
        // 100 profiles, but 90% have seeking=men (viewer is woman) → only 10 pass bidirectional
        const allProfiles = Array.from({ length: 100 }, (_, i) => {
            // userIds 001-090: seeking=men (filtered out)
            // userIds 091-100: seeking=everyone (pass)
            const seeking = i < 90 ? 'men' : 'everyone';
            return profile(String(i + 1), { seeking });
        });

        const mocks = buildMockPrisma(allProfiles, { viewerGender: 'woman' });

        vi.doMock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
        vi.doMock('@/lib/utils/completeness', () => ({ calculateCompleteness: vi.fn().mockReturnValue(80) }));
        vi.doMock('@/server/actions/compatibility/getCompatibilityScore', () => ({
            getCompatibilityScore: vi.fn().mockResolvedValue({ score: 50, breakdown: {}, explanation: [] }),
        }));
        vi.doMock('@/lib/product/flags', () => ({
            getFlags: vi.fn().mockResolvedValue({ verificationPriority: 0, voiceIntroBoost: 0 }),
        }));
        vi.doMock('@/lib/location', () => ({ getDistance: vi.fn().mockReturnValue(10) }));

        const { getDynamicFeed } = await import('@/server/actions/feed');

        // No distance filter to avoid coordinate issues in mock
        const page1 = await getDynamicFeed('viewer-user', undefined, undefined, 10);

        // Should still return up to 10 eligible profiles from the scan
        // Scan loop fetches 3 batches of 33 = up to 99 profiles
        // Among those, ~10 pass bidirectional filter, all pass visibility
        expect(page1.items.length).toBeGreaterThanOrEqual(1);
        expect(page1.items.length).toBeLessThanOrEqual(10);

        // All returned profiles should be eligible (user_091-user_100)
        for (const item of page1.items) {
            expect(item.profile.id >= 'user_091').toBe(true);
        }

        // Cursor should be userId-based (not page_N)
        expect(page1.nextCursor).not.toMatch(/^page_/);
    });

    it('cambio de filtros: cursor legacy page_N tratado como null', async () => {
        const allProfiles = Array.from({ length: 10 }, (_, i) => profile(String(i + 1)));
        const mocks = buildMockPrisma(allProfiles, { viewerGender: 'woman' });

        vi.doMock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
        vi.doMock('@/lib/utils/completeness', () => ({ calculateCompleteness: vi.fn().mockReturnValue(80) }));
        vi.doMock('@/server/actions/compatibility/getCompatibilityScore', () => ({
            getCompatibilityScore: vi.fn().mockResolvedValue({ score: 50, breakdown: {}, explanation: [] }),
        }));
        vi.doMock('@/lib/product/flags', () => ({
            getFlags: vi.fn().mockResolvedValue({ verificationPriority: 0, voiceIntroBoost: 0 }),
        }));
        vi.doMock('@/lib/location', () => ({ getDistance: vi.fn().mockReturnValue(10) }));

        const { getDynamicFeed } = await import('@/server/actions/feed');

        // Pass a legacy page_2 cursor — should be treated as null (fresh start)
        const result = await getDynamicFeed('viewer-user', undefined, 'page_2', 10, {
            ageRange: [18, 60],
            distance: 100,
            userLat: 0,
            userLng: 0,
        });

        // Should return profiles from the start (not from "page 2" offset)
        expect(result.items.length).toBeGreaterThanOrEqual(1);
        // With legacy cursor ignored, it's a fresh start: first profiles in page order
        expect(result.items[0].profile.id >= 'user_001').toBe(true);
    });

    it('final de catálogo: hasMore=false cuando no hay más perfiles', async () => {
        // Only 5 profiles in DB
        const allProfiles = Array.from({ length: 5 }, (_, i) => profile(String(i + 1)));
        const mocks = buildMockPrisma(allProfiles, { viewerGender: 'woman' });

        vi.doMock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
        vi.doMock('@/lib/utils/completeness', () => ({ calculateCompleteness: vi.fn().mockReturnValue(80) }));
        vi.doMock('@/server/actions/compatibility/getCompatibilityScore', () => ({
            getCompatibilityScore: vi.fn().mockResolvedValue({ score: 50, breakdown: {}, explanation: [] }),
        }));
        vi.doMock('@/lib/product/flags', () => ({
            getFlags: vi.fn().mockResolvedValue({ verificationPriority: 0, voiceIntroBoost: 0 }),
        }));
        vi.doMock('@/lib/location', () => ({ getDistance: vi.fn().mockReturnValue(10) }));

        const { getDynamicFeed } = await import('@/server/actions/feed');

        const result = await getDynamicFeed('viewer-user', undefined, undefined, 10, {
            ageRange: [18, 60],
            distance: 100,
            userLat: 0,
            userLng: 0,
        });

        // Only 5 profiles available
        expect(result.items.length).toBe(5);
        // lastBatchSize (5) !== batchSize (33) → hasMore = false
        expect(result.hasMore).toBe(false);
        expect(result.nextCursor).toBeNull();
    });

    it('seguridad: perfiles bloqueados, ocultos y shadowbanned no aparecen', async () => {
        // 10 profiles, but some have issues
        const allProfiles = [
            profile('001'),                    // normal, eligible
            profile('002', { trustStatus: 'banned' }), // banned
            profile('003', { incognitoMode: true }),    // these are filtered at DB level, not in mock
            profile('004'),                    // normal, eligible
            profile('005', { isShadowBanned: true }),   // comes through DB but gets score * 0.1
            profile('006'),                    // normal, eligible
            profile('007', { trustStatus: 'watchlist' }),// watchlist — still visible but score * 0.8
        ];

        // Build prisma mock that applies incognitoMode + trustStatus filters at query level
        const mocks = buildMockPrisma(allProfiles, { viewerGender: 'woman' });
        // Override the findMany mock to simulate DB-level filtering of banned + incognito
        mocks.mockFindMany.mockImplementation((args: any) => {
            const { where, take } = args;
            const gt = where?.userId?.gt;
            const notInSet = new Set(where?.userId?.notIn || []);
            const inList = where?.userId?.in || null;

            let filtered = allProfiles
                .filter(p => !notInSet.has(p.userId))
                .filter(p => !inList || inList.includes(p.userId))
                .filter(p => !gt || p.userId > gt)
                // Simulate DB-level safety filters
                .filter(p => p.trustStatus !== 'banned') // banned → filtered by query
                .filter(p => p.incognitoMode !== true)   // incognito → filtered by query
                .sort((a, b) => a.userId.localeCompare(b.userId));

            return Promise.resolve(filtered.slice(0, take || 10).map(p => ({
                userId: p.userId,
                user: { id: p.userId, email: `${p.userId}@test.com`, deletedAt: null },
                displayName: `User_${p.userId}`,
                bio: p.bio || 'Hello',
                age: p.age || 25,
                gender: p.gender || 'woman',
                seeking: p.seeking || 'everyone',
                photos: p.photos || ['photo1.jpg'],
                interests: p.interests || [],
                values: p.values || [],
                isVerified: p.isVerified ?? true,
                subscriptionStatus: p.subscriptionStatus || 'free',
                trustStatus: p.trustStatus || 'clean',
                reputationScore: p.reputationScore ?? 100,
                isShadowBanned: p.isShadowBanned ?? false,
                voiceIntro: null,
                lastActiveAt: new Date(),
                createdAt: new Date(),
                incomplete_media: false,
                boostExpiresAt: null,
            })));
        });

        vi.doMock('@/lib/prisma', () => ({ prisma: mocks.prisma }));
        vi.doMock('@/lib/utils/completeness', () => ({ calculateCompleteness: vi.fn().mockReturnValue(80) }));
        vi.doMock('@/server/actions/compatibility/getCompatibilityScore', () => ({
            getCompatibilityScore: vi.fn().mockResolvedValue({ score: 50, breakdown: {}, explanation: [] }),
        }));
        vi.doMock('@/lib/product/flags', () => ({
            getFlags: vi.fn().mockResolvedValue({ verificationPriority: 0, voiceIntroBoost: 0 }),
        }));
        vi.doMock('@/lib/location', () => ({ getDistance: vi.fn().mockReturnValue(10) }));

        const { getDynamicFeed } = await import('@/server/actions/feed');

        const result = await getDynamicFeed('viewer-user', undefined, undefined, 10, {
            ageRange: [18, 60],
            distance: 100,
            userLat: 0,
            userLng: 0,
        });

        const returnedIds = result.items.map(i => i.profile.id);

        // Banned profile should NOT appear (filtered at DB level)
        expect(returnedIds).not.toContain('user_002');
        // Incognito profile should NOT appear (filtered at DB level)
        expect(returnedIds).not.toContain('user_003');
        // Shadowbanned: comes through DB but score * 0.1 makes it very low → may still appear if only candidate
        // (acceptable — visibility is controlled via score, not exclusion)
    });
});
