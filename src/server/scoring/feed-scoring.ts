import { UserProfile } from '@/lib/domain/types';
import { FlagConfig } from '@/lib/product/flags';

export interface ScoredCandidate {
    profile: UserProfile;
    score: {
        total: number;
        details: Record<string, number>;
        explanation: string[];
    };
    signals: {
        activeNow: boolean;
        highResponseRate: boolean;
        sharedInterests: number;
        messageResponseRate: number | null;
        lastActiveHours: number | null;
        highCompatibility: boolean;
    };
}

export interface ScoreParams {
    cp: {
        userId: string;
        isVerified: boolean;
        trustStatus: string;
        voiceIntro: string | null;
        subscriptionStatus: string;
        lastActiveAt: Date | null;
        interests: string[];
        photos: string[];
        email: string;
        displayName: string;
        bio: string;
        age: number | null;
        gender: string | null;
        seeking: string | null;
        city: string | null;
        zodiacSign: string | null;
        education: string | null;
        smoking: string | null;
        drinking: string | null;
        children: string | null;
        religion: string | null;
        musicGenres: string[];
        values: string[];
        createdAt: Date;
        reputationScore?: number;
        isShadowBanned?: boolean;
        boostExpiresAt?: Date | null;
        [key: string]: any;
    };
    profile: UserProfile;
    currentUserInterests: string[];
    messagesSent: number;
    now: Date;
    fiveMinutesAgo: Date;
    oneDayAgo: Date;
    deepScore: { score: number; breakdown: Record<string, number>; explanation: string[] };
    completeness: number;
    flags: FlagConfig;
    newUserBoost: number;
}

export function scoreCandidate(params: ScoreParams): ScoredCandidate {
    const {
        cp, profile, currentUserInterests,
        messagesSent, now, fiveMinutesAgo, oneDayAgo,
        deepScore, completeness, flags, newUserBoost
    } = params;

    const lastActive = cp.lastActiveAt as Date | null;
    const activeNow = lastActive ? lastActive > fiveMinutesAgo : false;
    const activeToday = lastActive ? lastActive > oneDayAgo : false;

    const candidateInterests = cp.interests || [];
    const sharedInterests = currentUserInterests.filter(i =>
        candidateInterests.some((ci: string) => ci.toLowerCase() === i.toLowerCase())
    ).length;

    const messageResponseRate = messagesSent > 0 ? Math.min(1, messagesSent / 10) : null;
    const highResponseRate = messagesSent >= 5;

    let totalScore = deepScore.score * 0.5;

    if (cp.isVerified) totalScore += flags.verificationPriority;

    if (completeness >= 80) totalScore += 20;
    else if (completeness >= 60) totalScore += 10;
    else if (completeness < 50) totalScore *= 0.5;

    if (cp.voiceIntro) totalScore += flags.voiceIntroBoost;

    if (cp.trustStatus === 'watchlist') totalScore *= 0.8;

    const reputation = cp.reputationScore ?? 100;
    const isShadowBanned = cp.isShadowBanned ?? false;

    if (isShadowBanned) totalScore *= 0.1;
    else if (reputation < 50) totalScore *= 0.6;
    else if (reputation < 70) totalScore *= 0.8;
    else if (reputation > 90) totalScore += 10;

    if (activeNow) totalScore += 15;
    else if (activeToday) totalScore += 5;

    if (highResponseRate) totalScore += 15;

    totalScore += sharedInterests * 3;

    if (completeness >= 80 && activeToday) totalScore += 5;

    const boostExpires = cp.boostExpiresAt;
    if (boostExpires && new Date(boostExpires) > now) {
        totalScore += 30;
    }

    if (cp.subscriptionStatus === 'plus') {
        totalScore += 15;
    }

    const highCompatibility = totalScore >= 60;

    return {
        profile: { ...profile, completenessScore: completeness },
        score: {
            total: Math.min(100, Math.round(totalScore * newUserBoost)),
            details: deepScore.breakdown,
            explanation: deepScore.explanation,
        },
        signals: {
            activeNow,
            highResponseRate,
            sharedInterests,
            messageResponseRate,
            lastActiveHours: lastActive ? Math.round((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60)) : null,
            highCompatibility,
        },
    };
}
