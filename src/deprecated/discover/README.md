# Deprecated — Discover Feeds

## discover-ranking.ts
- **Type**: Feed generator (getAdvancedFeed)
- **Lines**: 324
- **Status**: DEPRECATED — 0 runtime consumers
- **Replaced by**: `src/server/actions/feed.ts` (getDynamicFeed)
- **Reason**: Never imported or called by any production code. Used compatibility-v2 engine which is also deprecated.
- **Removal date**: 2026-06-06

## discover-personalized.ts
- **Type**: Feed generator (getPersonalizedFeed)
- **Lines**: 228
- **Status**: DEPRECATED — 0 runtime consumers, marked @deprecated in source
- **Replaced by**: `src/server/actions/feed.ts` (getDynamicFeed)
- **Reason**: Never imported or called. Used 8-signal emotional ranking that was never connected to UI.
- **Removal date**: 2026-06-06
