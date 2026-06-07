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

## ORPHAN Routes (exist, no navigation)

### INCOMPLETE — MOVED TO DEPRECATED (V3.3)

These features were started but never finished. Moved to `src/deprecated/routes/` in V3.3.

| Route | New Location |
|-------|-------------|
| /onboarding/emotional + API | `src/deprecated/routes/onboarding/emotional/page.tsx` |
| | `src/deprecated/routes/emotional-onboarding-api/route.ts` |
| | `src/deprecated/ai/copilot/emotional-onboarding.ts` |
| /onboarding/female-safety | `src/deprecated/routes/onboarding/female-safety/page.tsx` |

### LEGACY — MOVED TO DEPRECATED (V3.4)

| Route | New Location |
|-------|-------------|
| /launch | `src/deprecated/routes/launch/page.tsx` |
| /waitlist | `src/deprecated/routes/waitlist/page.tsx` |
| /community/ambassador/apply | `src/deprecated/routes/community/ambassador/apply/page.tsx` |
| /partners/index | `src/deprecated/routes/partners/index/page.tsx` |

### ABANDONED — MOVED TO DEPRECATED (V3.4)

| Route | New Location |
|-------|-------------|
| /profile/badges | `src/deprecated/routes/profile/badges/page.tsx` |
| /profile/analytics | `src/deprecated/routes/profile/analytics/page.tsx` |
| /profile/compatibility/[candidateId] | `src/deprecated/routes/profile/compatibility/[candidateId]/page.tsx` |
| /settings/audio | `src/deprecated/routes/settings/audio/page.tsx` |
| /settings/subscription | `src/deprecated/routes/settings/subscription/page.tsx` |
| /settings/referral | `src/deprecated/routes/settings/referral/page.tsx` |
| /settings/safety/experience | `src/deprecated/routes/settings/safety/experience/page.tsx` |
| /settings/safety/center | `src/deprecated/routes/settings/safety/center/page.tsx` |

---

## Deprecation Calendar

| Version | Action |
|---------|--------|
| V3.2 | Classified all orphan routes (INCOMPLETE / LEGACY / ABANDONED) |
| V3.3 | Moved INCOMPLETE routes + API + AI modules to `src/deprecated/` |
| V3.4 | Moved LEGACY and ABANDONED routes to `src/deprecated/routes/` |
| V3.5 | Remove deprecated tree entirely (all `src/deprecated/` content) |
