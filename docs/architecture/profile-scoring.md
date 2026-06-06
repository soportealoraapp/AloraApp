# Profile Scoring Systems

## SSOT Matrix

| System | File | Max Score | Used By | Role |
|--------|------|-----------|---------|------|
| profile-completeness.ts | `src/server/services/profile-completeness.ts` | 100 | feed.ts, badges.ts, profile page, api/profile/analytics | **PRIMARY** (Discover ranking) |
| profile-quality.ts | `src/server/services/profile-quality.ts` | 100 | quality-ranking.ts, user-progress.ts | **SECONDARY** (Marketplace balance + user progress) |
| trust-score.ts | `src/server/services/trust-score.ts` | 100 | quality-ranking.ts, user-progress.ts | **SECONDARY** (Trust + profile blended) |
| activation-score.ts | `src/lib/product/activation-score.ts` | 100 | activation-tasks.ts, discover activation card | **ACTIVATION** (Behavioral, not quality) |

## profile-completeness.ts (PRIMARY)

| Field | Max Points |
|-------|-----------|
| Photos (≥4: 25, ≥2: 15, ≥1: 5) | 25 |
| Bio (≥100: 20, ≥50: 15, ≥20: 10) | 20 |
| Interests (≥5: 15, ≥3: 10) | 15 |
| Values (≥2: 10) | 10 |
| City | 5 |
| Education | 5 |
| Zodiac Sign | 5 |
| Verified | 10 |
| Voice Intro | 5 |

**Used by feed.ts for discover ranking — this is the SSOT for profile completeness.**

## profile-quality.ts (SECONDARY)

Different weights: photos 20, bio 20, interests 15, values 15, music 10, goals 10, quizzes 5, verified 5.

**Used only by marketplace-balance/quality-ranking.ts and user-progress.ts. Not used by feed or UI.**

## activation-score.ts (ACTIVATION)

Measures BEHAVIORAL activation (has the user performed key actions?), not profile quality.

| Factor | Weight |
|--------|--------|
| Onboarding completed | 5 |
| Profile complete (bio 50+ chars, 3+ interests, 2+ values) | 25 |
| Photos (3+) | 15 |
| Voice intro | 15 |
| Quiz completed | 10 |
| Daily question answered | 5 |
| Verification | 10 |
| First like | 5 |
| First match | 5 |
| First message | 5 |

**This is an orthogonal concept to profile quality — measures user journey progression.**
