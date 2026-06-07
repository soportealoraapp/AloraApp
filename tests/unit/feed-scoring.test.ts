import { describe, it, expect } from 'vitest';
import { scoreCandidate, ScoreParams } from '@/server/scoring/feed-scoring';

const baseCp: ScoreParams['cp'] = {
    userId: 'user_1',
    isVerified: false,
    trustStatus: 'clean',
    voiceIntro: null,
    subscriptionStatus: 'free',
    lastActiveAt: null,
    interests: [],
    photos: [],
    email: 'test@test.com',
    displayName: 'Test',
    bio: '',
    age: null,
    gender: null,
    seeking: null,
    city: null,
    zodiacSign: null,
    education: null,
    smoking: null,
    drinking: null,
    children: null,
    religion: null,
    musicGenres: [],
    values: [],
    createdAt: new Date('2024-01-01'),
    reputationScore: 70,
};

const baseParams = (overrides?: Partial<ScoreParams>): ScoreParams => ({
    cp: { ...baseCp },
    profile: { id: 'user_1' } as any,
    currentUserInterests: [],
    messagesSent: 0,
    now: new Date('2024-06-01T12:00:00Z'),
    fiveMinutesAgo: new Date('2024-06-01T11:55:00Z'),
    oneDayAgo: new Date('2024-05-31T12:00:00Z'),
    deepScore: { score: 50, breakdown: {}, explanation: [] },
    completeness: 50,
    flags: {
        voiceIntroBoost: 15,
        verificationPriority: 20,
        activationCardEnabled: true,
        dailyPickReasoning: 'engine',
    },
    newUserBoost: 1,
    ...overrides,
});

describe('FeedScoringService: scoreCandidate', () => {
    it('base score is deepScore.score * 0.5', () => {
        const result = scoreCandidate(baseParams());
        expect(result.score.total).toBe(25);
    });

    it('verified user gets verificationPriority bonus', () => {
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, isVerified: true },
        }));
        expect(result.score.total).toBe(45);
    });

    describe('completeness tiers', () => {
        it('completeness >= 80 adds 20', () => {
            const result = scoreCandidate(baseParams({ completeness: 80 }));
            expect(result.score.total).toBe(45);
        });

        it('completeness >= 60 adds 10', () => {
            const result = scoreCandidate(baseParams({ completeness: 60 }));
            expect(result.score.total).toBe(35);
        });

        it('completeness < 50 multiplies by 0.5', () => {
            const result = scoreCandidate(baseParams({ completeness: 40 }));
            expect(result.score.total).toBe(13);
        });

        it('completeness exactly 50 leaves score unchanged', () => {
            const result = scoreCandidate(baseParams({ completeness: 50 }));
            expect(result.score.total).toBe(25);
        });
    });

    it('voice intro adds voiceIntroBoost', () => {
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, voiceIntro: 'hello.mp3' },
        }));
        expect(result.score.total).toBe(40);
    });

    it('watchlist trust status multiplies by 0.8', () => {
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, trustStatus: 'watchlist' },
        }));
        expect(result.score.total).toBe(20);
    });

    describe('shadow ban and reputation', () => {
        it('shadow banned multiplies by 0.1', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, isShadowBanned: true, reputationScore: 100 },
            }));
            expect(result.score.total).toBe(3);
        });

        it('reputation < 50 multiplies by 0.6', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, reputationScore: 40 },
            }));
            expect(result.score.total).toBe(15);
        });

        it('reputation < 70 multiplies by 0.8', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, reputationScore: 60 },
            }));
            expect(result.score.total).toBe(20);
        });

        it('reputation > 90 adds 10', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, reputationScore: 95 },
            }));
            expect(result.score.total).toBe(35);
        });

        it('reputation exactly 90 does not add 10', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, reputationScore: 90 },
            }));
            expect(result.score.total).toBe(25);
        });
    });

    describe('activity bonuses', () => {
        it('active now adds 15', () => {
            const activeNow = new Date('2024-06-01T11:58:00Z');
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, lastActiveAt: activeNow },
            }));
            expect(result.score.total).toBe(40);
        });

        it('active today (but not now) adds 5', () => {
            const activeToday = new Date('2024-06-01T08:00:00Z');
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, lastActiveAt: activeToday },
            }));
            expect(result.score.total).toBe(30);
        });

        it('not active today gets no bonus', () => {
            const old = new Date('2024-05-30T12:00:00Z');
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, lastActiveAt: old },
            }));
            expect(result.score.total).toBe(25);
        });

        it('null lastActiveAt gets no bonus', () => {
            const result = scoreCandidate(baseParams({
                cp: { ...baseCp, lastActiveAt: null },
            }));
            expect(result.score.total).toBe(25);
        });
    });

    it('high response rate (>=5 messages sent) adds 15', () => {
        const result = scoreCandidate(baseParams({ messagesSent: 5 }));
        expect(result.score.total).toBe(40);
    });

    it('low response rate (<5 messages sent) does not add bonus', () => {
        const result = scoreCandidate(baseParams({ messagesSent: 4 }));
        expect(result.score.total).toBe(25);
    });

    it('shared interests add 3 per match', () => {
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, interests: ['music', 'hiking', 'cooking'] },
            currentUserInterests: ['Music', 'Hiking', 'gaming'],
        }));
        expect(result.score.total).toBe(31);
    });

    it('completeness >= 80 and activeToday adds 5 (synergy)', () => {
        const activeToday = new Date('2024-06-01T08:00:00Z');
        const result = scoreCandidate(baseParams({
            completeness: 80,
            cp: { ...baseCp, lastActiveAt: activeToday },
        }));
        expect(result.score.total).toBe(55);
    });

    it('synergy bonus not applied if completeness < 80', () => {
        const activeToday = new Date('2024-06-01T08:00:00Z');
        const result = scoreCandidate(baseParams({
            completeness: 79,
            cp: { ...baseCp, lastActiveAt: activeToday },
        }));
        expect(result.score.total).toBe(40);
    });

    it('synergy bonus not applied if not active today', () => {
        const result = scoreCandidate(baseParams({
            completeness: 80,
            cp: { ...baseCp, lastActiveAt: null },
        }));
        expect(result.score.total).toBe(45);
    });

    it('active boost adds 30', () => {
        const future = new Date('2024-07-01T12:00:00Z');
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, boostExpiresAt: future },
        }));
        expect(result.score.total).toBe(55);
    });

    it('expired boost does not add 30', () => {
        const past = new Date('2024-05-01T12:00:00Z');
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, boostExpiresAt: past },
        }));
        expect(result.score.total).toBe(25);
    });

    it('plus subscription adds 15', () => {
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, subscriptionStatus: 'plus' },
        }));
        expect(result.score.total).toBe(40);
    });

    it('newUserBoost multiplier is applied before clamp', () => {
        const result = scoreCandidate(baseParams({
            deepScore: { score: 100, breakdown: {}, explanation: [] },
            completeness: 80,
            cp: {
                ...baseCp,
                isVerified: true,
                voiceIntro: 'hello.mp3',
                reputationScore: 95,
                subscriptionStatus: 'plus',
            },
            newUserBoost: 1.5,
        }));
        const expected = Math.round((100 * 0.5 + 20 + 20 + 15 + 10 + 15) * 1.5);
        expect(expected).toBeGreaterThan(100);
        expect(result.score.total).toBe(100);
    });

    it('score is clamped at 100', () => {
        const result = scoreCandidate(baseParams({
            deepScore: { score: 1000, breakdown: {}, explanation: [] },
            completeness: 80,
            cp: {
                ...baseCp,
                isVerified: true,
                voiceIntro: 'hello',
                reputationScore: 100,
                boostExpiresAt: new Date('2025-01-01'),
                subscriptionStatus: 'plus',
            },
        }));
        expect(result.score.total).toBeLessThanOrEqual(100);
        expect(result.score.total).toBe(100);
    });

    it('signals are correctly populated', () => {
        const activeNow = new Date('2024-06-01T11:58:00Z');
        const result = scoreCandidate(baseParams({
            cp: { ...baseCp, lastActiveAt: activeNow, interests: ['music'] },
            currentUserInterests: ['Music'],
            messagesSent: 10,
        }));
        expect(result.signals.activeNow).toBe(true);
        expect(result.signals.highResponseRate).toBe(true);
        expect(result.signals.sharedInterests).toBe(1);
        expect(result.signals.messageResponseRate).toBe(1);
        expect(result.signals.lastActiveHours).toBe(0);
    });

    it('profile carries completenessScore', () => {
        const result = scoreCandidate(baseParams({ completeness: 75 }));
        expect(result.profile.completenessScore).toBe(75);
    });
});
