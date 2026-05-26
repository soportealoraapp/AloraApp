# DB Index Audit

Run: `npx prisma migrate dev --name add_production_indexes`

## Manifest (already in schema)
- `User`: email (unique), id (PK)
- `Profile`: userId (unique)
- `Session`: userId (index)
- `Interaction`: fromUserId, toUserId (composite unique)
- `Match`: user1Id, user2Id (composite unique); createdAt (index)
- `Message`: matchId (index), senderId (index), createdAt (index)
- `AuditLog`: userId (index)
- `Notification`: userId (index)
- `PushToken`: token (unique), userId (index), deviceId (index)
- `DeviceFingerprint`: userId (index), deviceHash (index)
- `VerificationSubmission`: userId (index), status (index)
- `Report`: reportedId (index)
- `RateLimit`: key (unique)
- `IdempotencyKey`: [key, action] (composite unique), userId (index), createdAt (index)
- `AnalyticsEvent`: userId (index), event (index), createdAt (index)

## Recommended additional indexes for query performance

```prisma
model Message {
  @@index([matchId, createdAt])       // Chat load - messages sorted by time
}

model Interaction {
  @@index([fromUserId, createdAt])    // Feed - recent likes by user
  @@index([toUserId, createdAt])      // Feed - who liked me
}

model Report {
  @@index([status, createdAt])        // Admin - pending reports sorted
  @@index([reporterId, createdAt])    // Admin - user report history
}

model Notification {
  @@index([userId, readAt, createdAt]) // User - unread notifications
}

model AnalyticsEvent {
  @@index([event, createdAt])          // Analytics queries by event type + time
  @@index([userId, event, createdAt])  // User-specific analytics
}
```

## Query patterns to optimize

1. **Feed generation**: `Profile.findMany` with `userId notIn` + `trustStatus` + `gender` + ordering by `userId`
   - Index: `[trustStatus, gender, userId]` on Profile

2. **Admin search**: `User.findMany` with `email`/`name` search + role filter
   - Index: `[role, email]` on User

3. **Chat loading**: `Message.findMany` with `matchId` + `createdAt` order
   - Index: `[matchId, createdAt]` on Message (already recommended above)

4. **Active user analytics**: `AnalyticsEvent` by event + date range
   - Index: `[event, createdAt]` on AnalyticsEvent (already recommended above)

## N+1 query risks

All known N+1 patterns have been addressed:
- Feed: Profiles loaded with `include: { user: true }` (single query)
- Message list: Match loaded with `include: { messages: { include: { sender: true } } }` (2 queries)
- Admin lists: Paginated with relational joins
