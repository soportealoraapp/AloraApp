import { UserProfile } from "../domain/types";

/**
 * Calculates a profile completeness score from 0 to 100.
 * Photos (2+) = 40% (20% for first, 20% for second)
 * Bio (min 20 chars) = 20%
 * Interests (3+) = 20%
 * Basic Info (Education, City, Zodiac) = 20% (approx 6.6% each)
 */
export function calculateCompleteness(profile: Partial<UserProfile>): number {
    let score = 0;

    // 1. Photos (Max 40)
    if (profile.photos && profile.photos.length > 0) {
        score += 20; // First photo
        if (profile.photos.length >= 2) score += 20; // Second photo
    }

    // 2. Bio (Max 20)
    if (profile.bio && profile.bio.trim().length >= 20) {
        score += 20;
    } else if (profile.bio && profile.bio.trim().length > 0) {
        score += 10; // Partial credit for short bio
    }

    // 3. Interests (Max 20)
    if (profile.interests && profile.interests.length >= 3) {
        score += 20;
    } else if (profile.interests && profile.interests.length > 0) {
        score += 10; // Partial credit for at least one
    }

    // 4. Basic Info (Max 20)
    let basicCount = 0;
    if (profile.city) basicCount++;
    if (profile.education) basicCount++;
    if (profile.zodiacSign) basicCount++;

    score += Math.min(20, basicCount * 7);

    return Math.min(100, score);
}
