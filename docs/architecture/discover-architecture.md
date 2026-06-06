# Discover Architecture

## Active Feed

| Attribute | Value |
|-----------|-------|
| **Generator** | `getDynamicFeed()` in `src/server/actions/feed.ts` |
| **Consumer** | `src/app/api/discover/route.ts` → `use-discover.ts` hook → `discover/page.tsx` |
| **Ranking** | Score-based descending (`visible.sort((a, b) => b.score.total - a.score.total)`) |
| **Clamp** | `Math.min(100, Math.round(totalScore))` |
| **Lines** | 474 |

## Scoring Formula

```
totalScore = deepScore.score × 0.5           // compatibility (50%)
           + verificationPriority              // +20 default
           + completeness bonus                // +20 (≥80%), +10 (≥60%), ×0.5 (<50%)
           + voiceIntroBoost                   // +15 default
           × reputation multiplier              // ×0.1 shadowban, ×0.6 rep<50, ×0.8 rep<70, +10 rep>90
           + activity bonus                     // +15 active now, +5 active today
           + response rate bonus               // +15 if ≥5 msgs/7d
           + sharedInterests × 3               // per shared interest
           + completeness+activity combo       // +5 if ≥80% + active today
           + boost bonus                        // +30 if boost active
           + subscription bonus                 // +15 if Plus
final = Math.min(100, round(totalScore))
```

## Minimum Threshold

Profiles must have:
- `photos.length >= 1`
- `completenessScore >= 40`

## Exclusion Set

Profiles are excluded if they are:
- The current user
- Blocked by or blocking the user
- Already interacted with (like/pass)
- Already matched
- Reported by or reporting the user
- trustStatus === 'banned'
- incognitoMode === true
- showMeInDiscover === false

## Deprecated Feeds

| Feed | File | Status | Reason |
|------|------|--------|--------|
| discover-ranking.ts | `src/deprecated/discover/discover-ranking.ts` | DEPRECATED | 0 consumers; used unused compatibility-v2 engine |
| discover-personalized.ts | `src/deprecated/discover/discover-personalized.ts` | DEPRECATED | 0 consumers; marked @deprecated in source |
