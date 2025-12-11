import { describe, it, expect } from 'vitest';
import { matchingService } from '../matching-service';
import { UserProfile } from '../types';

describe('Matching Algorithm Stress Test', () => {
    const generateProfile = (i: number): UserProfile => ({
        uid: `user_${i}`,
        displayName: `User ${i}`,
        age: 20 + (i % 30),
        gender: i % 2 === 0 ? 'woman' : 'man',
        interests: [`Interest ${i % 5}`],
        values: [`Value ${i % 3}`],
        smoking: i % 3 === 0 ? 'no' : 'yes',
        // ... minimal fields
    } as any);

    it('should handle 10,000 compatibility calculations under 100ms', () => {
        const userA = generateProfile(0);
        const others = Array.from({ length: 10000 }, (_, i) => generateProfile(i + 1));

        const start = performance.now();

        for (const other of others) {
            matchingService.calculateCompatibility(userA, other);
        }

        const end = performance.now();
        const duration = end - start;

        console.log(`Calculated 10,000 matches in ${duration.toFixed(2)}ms`);
        expect(duration).toBeLessThan(100);
    });
});
