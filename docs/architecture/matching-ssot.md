# Matching SSOT

## Official Matching Engine

| Attribute | Value |
|-----------|-------|
| **Engine** | `src/lib/compatibility/engine.ts` — `calculateCompatibility()` |
| **Entry point** | `src/server/actions/compatibility/getCompatibilityScore.ts` — `getCompatibilityScore()` |
| **Dimensions** | 7 (weighted) |
| **Score range** | 0-100 |
| **Status** | **PRIMARY** |

## Official Dimensions & Weights

| Dimension | Weight | Scored by |
|-----------|--------|-----------|
| Values | 30% | `scoreValues()` — Jaccard similarity on profile.values |
| Relationship Goals | 20% | `scoreRelationshipGoals()` — seeking alignment + bio intent signals |
| Personality | 15% | `scorePersonality()` — bio keyword analysis (expressive/reserved, active/calm) |
| Quizzes | 13% | `scoreQuizzes()` — answer-by-answer match percentage on shared quizzes |
| Interests | 10% | `scoreInterests()` — Jaccard + niche bonus (max +20) |
| Lifestyle | 7% | `scoreLifestyle()` — smoking, drinking, children, education, religion |
| Daily Question | 5% | `scoreDailyQuestion()` — category match + answer length similarity |

## Consumption Chain

```
calculateCompatibility(userIdA, userIdB)
  → getCompatibilityScore(userId, candidateId)     [entry point]
    → getDynamicFeed (feed.ts)                     [discover ranking]
    → daily-compatibility.ts                       [daily picks]
    → post-match.ts                                [match screen]
    → match-analytics.ts                           [admin metrics]
    → daily-picks/route.ts                         [daily cards]
```

## Deprecated Engines

| Engine | File | Status | Reason |
|--------|------|--------|--------|
| compatibility-v2 | `src/deprecated/ai/compatibility-v2/` | DEPRECATED | 0 consumers after discover-ranking.ts deprecation |
| hybrid-model | `src/deprecated/ai/hybrid-model/` | DEPRECATED | 0 consumers ever |
| recommended-matching | `src/deprecated/ai/matching/` | DEPRECATED | Hardcoded stub, 0 consumers |

## Secondary Engine (not matching, uses matching)

| Engine | File | Status | Use |
|--------|------|--------|-----|
| quality-ranking | `src/server/services/marketplace-balance/quality-ranking.ts` | ACTIVE | Marketplace balance — combines compatibility (30%) + conversation (25%) + trust (20%) + profile (15%) + activity (10%). Not used for feed ranking. |
