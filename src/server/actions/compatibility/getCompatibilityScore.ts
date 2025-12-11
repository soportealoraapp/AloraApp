'use server';

import { adminDb } from '../../firebase/admin';
import { featureBuilder } from '@/ai/compatibility/hybrid-model/feature-builder';
import { hybridScorer } from '@/ai/compatibility/hybrid-model/scorer';
import { explainability } from '@/ai/compatibility/hybrid-model/explainability';
import { UserProfile } from '@/lib/domain/types';
import { getHeartScore } from '../heartscore';

export async function getCompatibilityScore(userId: string, candidateId: string) {
    // 1. Fetch Data
    const [userDoc, candidateDoc] = await Promise.all([
        adminDb.collection('profiles').doc(userId).get(),
        adminDb.collection('profiles').doc(candidateId).get()
    ]);

    if (!userDoc.exists || !candidateDoc.exists) throw new Error("User not found");

    const userA = { id: userId, ...userDoc.data() } as UserProfile;
    const userB = { id: candidateId, ...candidateDoc.data() } as UserProfile;

    const [scoreA, scoreB] = await Promise.all([
        getHeartScore(userId),
        getHeartScore(candidateId)
    ]);

    // 2. Build Features
    const features = featureBuilder.buildFeatures(userA, userB, scoreA, scoreB);

    // 3. Score
    const result = hybridScorer.score(features);

    // 4. Explain
    const explanation = explainability.explainScore(result);

    return {
        score: result.totalScore,
        breakdown: result.breakdown,
        explanation
    };
}
