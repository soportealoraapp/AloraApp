# Route Map

## Classification Key
- **ACTIVE**: Has navigation references from UI
- **ADMIN**: Admin-only, navigable from admin index
- **ORPHAN**: Exists on disk, no navigation references
- **DEPRECATED**: Moved to src/deprecated/
- **LEGACY**: Abandoned feature, kept for reference

## ACTIVE Routes

| Route | Page File | Navigation Source |
|-------|-----------|------------------|
| / | landing | Auth layouts |
| /discover | app/(app)/discover/page.tsx | Bottom nav, auth redirects |
| /matches | app/(app)/matches/page.tsx | Bottom nav |
| /chat | app/(app)/chat/page.tsx | Bottom nav |
| /chat/[id] | app/(app)/chat/[id]/page.tsx | Match screen, matches page |
| /notifications | app/(app)/notifications/page.tsx | Bottom nav |
| /profile | app/(app)/profile/page.tsx | Bottom nav |
| /profile/edit | app/(app)/profile/edit/page.tsx | Profile, settings, discover |
| /profile/[id] | app/(app)/profile/[id]/page.tsx | Discover cards, chat links |
| /profile/favorites | app/(app)/profile/favorites/page.tsx | Profile page |
| /profile/trust | app/(app)/profile/trust/page.tsx | Profile page |
| /profile/review | app/(app)/profile/review/page.tsx | Profile page |
| /profile/visitors | app/(app)/profile/visitors/page.tsx | Profile page |
| /compatibility | app/(app)/compatibility/page.tsx | Profile, discover |
| /compatibility/quiz/[id] | app/(app)/compatibility/quiz/[id]/page.tsx | Compatibility page |
| /settings | app/(app)/settings/page.tsx | Profile page |
| /settings/notifications | app/(app)/settings/notifications/page.tsx | Settings page |
| /settings/privacy | app/(app)/settings/privacy/page.tsx | Settings page |
| /settings/safety | app/(app)/settings/safety/page.tsx | Settings page |
| /settings/travel | app/(app)/settings/travel/page.tsx | Settings page |
| /settings/verification | app/(app)/settings/verification/page.tsx | Profile, safety, discover |
| /settings/privacy/blocked | app/(app)/settings/privacy/blocked/page.tsx | Privacy page |
| /settings/privacy/rejected | app/(app)/settings/privacy/rejected/page.tsx | Privacy page |
| /support | app/(app)/support/page.tsx | Settings, landing, auth |
| /contact | app/(app)/contact/page.tsx | Settings, landing, support |
| /login | app/(auth)/login/page.tsx | Landing, signup, settings |
| /signup | app/(auth)/signup/page.tsx | Landing, login |
| /forgot-password | app/(auth)/forgot-password/page.tsx | Login page |
| /onboarding | app/(auth)/onboarding/page.tsx | Auth gate (middleware redirect) |
| /terms | app/terms/page.tsx | Settings, privacy, landing, auth |
| /privacy | app/privacy/page.tsx | Settings, terms, landing, auth |

## ADMIN Routes (navigable from /admin)

| Route | Page File |
|-------|-----------|
| /admin | app/(app)/admin/page.tsx |
| /admin/users | app/(app)/admin/users/page.tsx |
| /admin/reports | app/(app)/admin/reports/page.tsx |
| /admin/verifications | app/(app)/admin/verifications/page.tsx |
| /admin/metrics | app/(app)/admin/metrics/page.tsx |
| /admin/experiments | app/(app)/admin/experiments/page.tsx |
| /admin/activation | app/(app)/admin/activation/page.tsx |
| /admin/match-quality | app/(app)/admin/match-quality/page.tsx |
| /admin/marketplace-command | app/(app)/admin/marketplace-command/page.tsx |
| /admin/go-no-go | app/(app)/admin/go-no-go/page.tsx |
| /admin/women-strategy | app/(app)/admin/women-strategy/page.tsx |
| /admin/success-stories | app/(app)/admin/success-stories/page.tsx |
| /admin/north-star | app/(app)/admin/north-star/page.tsx |

## ORPHAN Routes (exist, no navigation — candidates for connection or deprecation)

| Route | Page File | Recommended Action |
|-------|-----------|-------------------|
| /onboarding/emotional | app/(app)/onboarding/emotional/page.tsx | Connect via onboarding wizard |
| /onboarding/female-safety | app/(app)/onboarding/female-safety/page.tsx | Connect via onboarding wizard |
| /profile/badges | app/(app)/profile/badges/page.tsx | LEGACY — move to deprecated |
| /profile/analytics | app/(app)/profile/analytics/page.tsx | LEGACY — move to deprecated |
| /profile/compatibility/[candidateId] | app/(app)/profile/compatibility/[candidateId]/page.tsx | LEGACY — move to deprecated |
| /settings/audio | app/(app)/settings/audio/page.tsx | LEGACY — move to deprecated |
| /settings/subscription | app/(app)/settings/subscription/page.tsx | LEGACY — move to deprecated |
| /settings/referral | app/(app)/settings/referral/page.tsx | LEGACY — move to deprecated |
| /settings/safety/experience | app/(app)/settings/safety/experience/page.tsx | LEGACY — move to deprecated |
| /settings/safety/center | app/(app)/settings/safety/center/page.tsx | LEGACY — move to deprecated |
| /launch | app/launch/page.tsx | LEGACY — move to deprecated |
| /waitlist | app/waitlist/page.tsx | LEGACY — move to deprecated |
| /community/ambassador/apply | community/ambassador/apply/page.tsx | LEGACY — move to deprecated |
| /partners/index | partners/index/page.tsx | LEGACY — move to deprecated |
