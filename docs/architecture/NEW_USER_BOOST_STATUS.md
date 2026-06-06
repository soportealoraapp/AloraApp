# New User Boost — Audit Report

## Status: CONNECTED (V3.2)

The new-user-boost.ts service is now connected to the feed scoring pipeline.

## Integration

| Step | Location |
|------|----------|
| Import | `src/server/actions/feed.ts:9` |
| Fetch boost multiplier | `feed.ts:354` — `const newUserBoost = await getNewUserBoost(currentUserId)` |
| Apply multiplier | `feed.ts:441` — `Math.min(100, Math.round(totalScore * newUserBoost))` |

## How it works

- `getNewUserBoost(userId)`: returns 1.3x for users <48h old, 1.2x for 48-72h, 1.0x after
- Boost is per-viewer (currentUserId), not per-candidate
- Multiplier applied before clamping to 100 — everyone has the same ceiling
- Effect: new users rank higher in the scored sort (feed.ts:463), not clamped above max

## What Changed

- new-user-boost.ts: no changes (was already correct)
- feed.ts: +2 lines (import + call), 1 line modified (apply multiplier)
