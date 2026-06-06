# Analytics Event Taxonomy

## Canonical Event Names

| Event | Canonical Name | Emitters | Consumers | Status |
|-------|---------------|----------|-----------|--------|
| first_match | `first_match` | like/route.ts:196-197 | analytics.ts:76, activation-funnel.ts:62, product-metrics.ts:248,262,274,286 | CANONICAL |
| first_message | `first_message` | chat/send/route.ts:144, chat/[id]/page.tsx:193 (via AnalyticsEvents.FIRST_MESSAGE_SENT) | analytics.ts:77, activation-funnel.ts:72, product-metrics.ts:250,264,276,288, activation-score.ts:58,125, gamification/journey/route.ts:72 | CANONICAL |
| first_reply | `first_reply` | chat/send/route.ts:151 | analytics.ts:78, activation-funnel.ts:77 | CANONICAL |
| match_created | `match_created` | discover/page.tsx:204,235 | events.ts:20, timeline/route.ts:51 | CANONICAL (client-side only) |

## Legacy Names (historical data only)

| Event | Legacy Name | Last Emitted | Notes |
|-------|-------------|-------------|-------|
| first_message_sent | `first_message_sent` | Pre-2026-06-06 | Renamed to `first_message`. Historical data remains in DB. |
| first_reply_received | `first_reply_received` | Never emitted | Was defined in events.ts but never used. No historical impact. |

## Event → Analytics pipeline

```
Emitter (server action / client hook)
  → trackEvent(userId, 'canonical_name', metadata)
    → prisma.analyticsEvent.create({ event: 'canonical_name', ... })
      → Analytics queries filter by event: 'canonical_name'
        → Funnel / Retention / Cohort dashboards
```
