# New User Boost — Audit Report

## Status: ORPHANED

The cold start mechanism exists but is completely disconnected from the runtime.

## Evidence

| Check | Result | Source |
|-------|--------|--------|
| File exists | ✅ | `src/server/services/new-user-boost.ts` (40 lines) |
| Function `getNewUserBoost()` | ✅ | Returns multiplier: +30% (0-48h), +20% (48-72h), 1.0 (72h+) |
| Function `isNewUserBoosted()` | ✅ | Boolean wrapper |
| **Static imports** | **0** | No file imports `getNewUserBoost` or `isNewUserBoosted` |
| **Dynamic imports** | **0** | No `import('...new-user-boost')` found |
| **Runtime calls** | **0** | `feed.ts` has no new user boost logic |

## What Would Need to Happen to Connect It

1. In `feed.ts` scoring (line ~430-440), after computing `totalScore`:
   ```
   totalScore *= await getNewUserBoost(candidate.profile.id);
   ```
2. Optional: Add flag in `flags.ts` to control via experiment

## Recommendation

Not implementing in this phase. Documented for future cold start initiative.
