/**
 * Centralized profile completeness calculation.
 * Single source of truth — used by both frontend and backend.
 * 
 * Scoring:
 * - Photos (≥4): 25 points (≥2: 15, ≥1: 5)
 * - Bio (≥100 chars): 20 points (≥50: 15, ≥20: 10)
 * - Interests (≥5): 15 points (≥3: 10)
 * - Values (≥2): 10 points
 * - City: 5 points
 * - Education: 5 points
 * - Zodiac sign: 5 points
 * - Verified: 10 points
 * - Voice intro: 5 points
 */

export interface ProfileData {
  photos?: string[] | null;
  bio?: string | null;
  interests?: string[] | null;
  values?: string[] | null;
  city?: string | null;
  education?: string | null;
  zodiacSign?: string | null;
  isVerified?: boolean | null;
  voiceIntro?: string | null;
}

export function calculateProfileCompleteness(profile: ProfileData): number {
  let score = 0;

  // Photos (max 25)
  const photoCount = profile.photos?.length || 0;
  if (photoCount >= 4) score += 25;
  else if (photoCount >= 2) score += 15;
  else if (photoCount >= 1) score += 5;

  // Bio (max 20)
  const bioLength = (profile.bio || '').trim().length;
  if (bioLength >= 100) score += 20;
  else if (bioLength >= 50) score += 15;
  else if (bioLength >= 20) score += 10;

  // Interests (max 15)
  const interestCount = profile.interests?.length || 0;
  if (interestCount >= 5) score += 15;
  else if (interestCount >= 3) score += 10;

  // Values (max 10)
  const valueCount = profile.values?.length || 0;
  if (valueCount >= 2) score += 10;

  // City (5)
  if (profile.city) score += 5;

  // Education (5)
  if (profile.education) score += 5;

  // Zodiac sign (5)
  if (profile.zodiacSign) score += 5;

  // Verified (10)
  if (profile.isVerified) score += 10;

  // Voice intro (5)
  if (profile.voiceIntro) score += 5;

  return Math.min(100, score);
}
