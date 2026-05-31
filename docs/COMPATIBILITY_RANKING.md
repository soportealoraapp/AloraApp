# Alora — Compatibility Ranking Technical Documentation

## Overview

The compatibility score directly influences the order in which profiles appear in the Discover feed. This document explains the scoring system, weights, and expected impact.

## Compatibility Engine (`src/lib/compatibility/engine.ts`)

The compatibility score is calculated across **6 dimensions**:

| Dimension | Weight | Method |
|-----------|--------|--------|
| **Values** | 30% | Jaccard similarity on shared values array |
| **Relationship Goals** | 20% | Direct comparison of `lookingFor` field |
| **Personality** | 15% | Bio keyword analysis (love, adventure, family, growth, etc.) |
| **Quizzes** | 15% | Answer comparison from completed quizzes |
| **Interests** | 10% | Jaccard similarity + niche interest bonus |
| **Lifestyle** | 10% | Smoking, drinking, children, education, religion comparison |

**Output:** A score from 0-100 with Spanish-language explanations for each dimension.

## Feed Ranking (`src/server/actions/feed.ts`)

The final score for each candidate profile is calculated as:

```
finalScore = baseCompatibilityScore + bonuses
```

### Base Score (SPRINT 2 — REBALANCED)
- `compatibilityScore * 0.5` — 50% weight of total (was 30%)

### Bonus Points (SPRINT 2 — REBALANCED)

| Factor | Points | Condition | Before |
|--------|--------|-----------|--------|
| Boost active | +30 | User has active boost | +50 |
| Active now | +20 | User is currently online | +25 |
| Plus subscription | +15 | Priority boost for paid users | +35 |
| Verified | +15 | Identity verified | +15 |
| High response rate | +15 | 5+ messages sent historically | +15 |
| Active today | +10 | Logged in today | +10 |
| Complete profile (90+) | +15 | Profile completeness ≥ 90% | +20 |
| Complete profile (70+) | +10 | Profile completeness ≥ 70% | +10 |
| Shared interests | +3 each | Per shared interest | +5 |
| Complete + active today | +10 | Both conditions met | +10 |
| Reputation > 90 | +10 | High trust score | +10 |

### Penalty Factors

| Factor | Penalty | Condition |
|--------|---------|-----------|
| Profile incomplete (<50) | ×0.5 | Completeness score below 50 |
| Shadow banned | ×0.1 | Account shadow banned |
| Reputation < 50 | ×0.6 | Low trust score |
| Reputation < 70 | ×0.8 | Below-average trust score |
| On watchlist | ×0.8 | Flagged for review |

### Exclusion Filters
- Self (current user)
- Blocked users
- Already interacted users
- Matched users
- Reported users
- Gender seeking mismatch
- Distance exceeding filter
- No photos
- `incomplete_media` flag

## Impact Analysis

### Before Compatibility Integration
Profiles were ordered primarily by: recency, boost status, and random factor. Users saw mostly active profiles regardless of compatibility.

### After Compatibility Integration
With 30% weight on compatibility:
- **High-compatibility profiles** (80+ score) appear approximately **30% higher** in the feed
- **Low-compatibility profiles** (below 40 score) appear approximately **30% lower**
- Combined with boost (+50) and activity (+25) signals, a high-compatibility active user can rank up to **105 points** above baseline

### Expected Impact on Matches
- Higher match rate from likes (users are more likely to match with compatible profiles)
- Higher conversation quality (shared values/interests create natural conversation flow)
- Improved retention (users find more relevant connections)

## Advanced Feed Algorithms

Two additional algorithms exist but are **not currently active** by default:

### `discover-ranking.ts` — 9-Signal Algorithm
Recency, trust, emotional compatibility, behavioral compatibility, response rate, conversation quality, profile effort, shared activity, exploration bonus. Includes diversity labeling and dedup.

### `discover-personalized.ts` — 8-Signal Algorithm
Emotional compatibility, response style, pacing, conversation depth, lifestyle overlap, long-term alignment, attachment balance, emotional safety. Includes 20% diversity injection. Redis cached 2 minutes.

These can be activated by modifying the `getDynamicFeed` function in `src/server/actions/feed.ts`.

## Configuration

To adjust compatibility weight, modify `src/server/actions/feed.ts`:

```typescript
// Line ~180 in feed.ts
score += compatibilityScore * 0.3; // Adjust this multiplier
```

To adjust dimension weights, modify `src/lib/compatibility/engine.ts`:

```typescript
// In calculateCompatibility function
const weights = {
    values: 0.30,
    relationshipGoals: 0.20,
    personality: 0.15,
    quizzes: 0.15,
    interests: 0.10,
    lifestyle: 0.10,
};
```
