import { describe, it, expect } from 'vitest';
import { hybridScorer } from '@/ai/compatibility/hybrid-model/scorer';
import { featureBuilder } from '@/ai/compatibility/hybrid-model/feature-builder';

// Mock objects
const mockUser = { id: '1', age: 25, isVerified: true, interests: [] } as any;
const mockUserB = { id: '2', age: 26, isVerified: true, interests: [] } as any;
const mockScore = { score: 100 } as any;

describe('Phase 11: Deep Chemistry Engine', () => {
    it('Feature Builder calculates age diff', () => {
        const features = featureBuilder.buildFeatures(mockUser, mockUserB, mockScore, mockScore);
        expect(features.ageDiff).toBe(1);
    });

    it('Scorer returns valid range', () => {
        const features = featureBuilder.buildFeatures(mockUser, mockUserB, mockScore, mockScore);
        const result = hybridScorer.score(features);
        expect(result.totalScore).toBeGreaterThanOrEqual(0);
        expect(result.totalScore).toBeLessThanOrEqual(100);
        expect(result.breakdown).toBeDefined();
    });
});
