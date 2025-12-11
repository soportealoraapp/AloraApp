import { describe, it, expect } from 'vitest';
import { matchingService } from '../matching-service';
import { UserProfile } from '../types';

describe('Matching Service', () => {
    const baseProfile: UserProfile = {
        uid: '1',
        email: 'test@test.com',
        displayName: 'Test',
        age: 25,
        gender: 'woman',
        seeking: 'men',
        city: 'Madrid',
        photos: [],
        interests: ['Travel', 'Music'],
        values: 'Honesty', // Fix: values should be array based on service usage, but type definition says string[]? Let's check types.ts
        // In matching-service it treats values as array: user2Profile.values?.includes(v)
        // In types.ts: values: string[]
        values: ['Honesty', 'Kindness'],
        musicGenres: ['Pop', 'Rock'],
        status: 'Single',
        bio: '',
        isVerified: true,
        verificationStatus: 'verified',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastActive: new Date(),
        isPremium: false,
        isActive: true,
        smoking: 'no',
        drinking: 'socially',
        children: 'no',
        education: 'university'
    };

    it('should calculate high compatibility for identical profiles', () => {
        const score = matchingService.calculateCompatibility(baseProfile, baseProfile);
        expect(score).toBe(100);
    });

    it('should calculate 0 compatibility for completely different profiles', () => {
        const diffProfile: UserProfile = {
            ...baseProfile,
            uid: '2',
            interests: ['Nothing'],
            values: ['Nothing'],
            musicGenres: ['Nothing'],
            smoking: 'heavy', // diff
            drinking: 'heavy', // diff
            children: 'yes', // diff
            education: 'none', // diff
            age: 50 // >10 years diff
        };
        const score = matchingService.calculateCompatibility(baseProfile, diffProfile);
        expect(score).toBe(0);
    });

    it('should calculate partial compatibility based on weights', () => {
        const partialProfile: UserProfile = {
            ...baseProfile,
            uid: '3',
            interests: ['Travel'], // 50% match on interests (weight 25) -> 12.5
            values: ['Honesty', 'Kindness'], // 100% match on values (weight 30) -> 30
            // Lifestyle matches -> 20
            // Music: 100% -> 10
            // Education: 100% -> 5
            // Age: 100% -> 10
            // Total expected around 87.5 => 88
        };

        // Let's re-calculate precisely
        // Interests: 1/2 match = 50% of 25 = 12.5
        // Values: 2/2 match = 100% of 30 = 30
        // Lifestyle: 3/3 match = 100% of 20 = 20
        // Music: 2/2 match = 100% of 10 = 10
        // Education: Match = 5
        // Age: Match = 10
        // Sum = 12.5 + 30 + 20 + 10 + 5 + 10 = 87.5 -> round to 88

        const score = matchingService.calculateCompatibility(baseProfile, partialProfile);
        expect(score).toBeGreaterThan(80);
        expect(score).toBeLessThan(90);
    });
});
