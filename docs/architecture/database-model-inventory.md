# Database Model Inventory

## Classification
- **ACTIVE**: Read + Write in production code
- **READ_ONLY**: Read queries exist, no Prisma writes found
- **GHOST**: Schema exists, zero references in .ts files
- **LEGACY**: Schema exists, minimal references, possibly from earlier version

## ACTIVE Models (Full CRUD)

| Model | Table | Reads | Writes | Primary Consumers |
|-------|-------|-------|--------|-------------------|
| User | users | ~30 files | user.ts, admin/users | Auth, profile, matching |
| Profile | profiles | ~40 files | user.ts, admin | Feed, discover, match |
| Match | matches | ~20 files | like/route.ts, admin | Matching, analytics |
| Message | messages | ~15 files | chat/send/route.ts | Chat, analytics |
| Interaction | interactions | ~8 files | like/route.ts | Discover exclusion |
| AnalyticsEvent | analytics_events | ~20 files | ~20+ emitters | Funnel, retention, cohorts |
| Block | blocks | ~15 files | block.ts | Safety, feed exclusion |
| Notification | notifications | ~10 files | push.ts | Push notifications |
| AuditLog | audit_logs | ~8 files | ~15+ writes | Safety, moderation |
| VerificationSubmission | verification_submissions | 5 files | verification/submit | Trust & safety |
| Report | reports | ~10 files | safety/report/route.ts | Moderation |
| DailyAnswer | daily_answers | 6 files | daily-question/route.ts | Compatibility engine |
| DailyQuestion | daily_questions | 2 files | daily-question.ts | Daily feature |
| Experiment | experiments | 4 files | admin/experiments | A/B testing |
| ExperimentVariant | experiment_variants | 3 files | admin/experiments | A/B testing |
| ExperimentAssignment | experiment_assignments | 5 files | flags.ts | A/B testing |
| Favorite | favorites | 3 files | profile/favorites/route.ts | Social |
| DailyPick | daily_picks | 2 files | daily-picks/route.ts | Discover |
| MatchFeedback | match_feedback | 2 files | match/feedback/route.ts | Quality metrics |
| PushToken | push_tokens | 3 files | push.ts | Notifications |
| NotificationPreference | notification_preferences | 3 files | push.ts | User preferences |
| ProfileVisit | profile_visits | 8 files | visit-tracker.ts | Social proof |
| Referral | referrals | 4 files | referral.ts | Growth |
| SuccessStory | success_stories | 2 files | admin/success-stories | Marketing |

## READ_ONLY Models (written by external process or raw SQL)

| Model | Reads | Writes | Issue |
|-------|-------|--------|-------|
| QuizResult | 14 files (activation-score, engine, funnel, metrics) | **0 Prisma writes** | Data source unknown — possibly raw SQL or external service |

## GHOST Models (schema only, zero .ts references)

| Model | Table | Status | Notes |
|-------|-------|--------|-------|
| RelationshipContext | relationship_contexts | GHOST | v3.1 feature — never wired |
| CommunicationNote | communication_notes | GHOST | Child of RelationshipContext |
| ConflictReflection | conflict_reflections | GHOST | Child of RelationshipContext |
| PostDatingEvent | post_dating_events | GHOST | v3.1 wellbeing feature |
| CooldownState | cooldown_states | GHOST | v3.1 feature |
| ClosureArtifact | closure_artifacts | GHOST | v3.1 feature |
| CopilotEvent | copilot_events | GHOST | Child of CopilotContext |
| WaitlistEntry | waitlist_entries | GHOST | Pre-launch feature |
| BetaCode | beta_codes | GHOST | Beta invitation system |

## LEGACY Models (minimal references)

| Model | Reads | Writes | Notes |
|-------|-------|--------|-------|
| Session | Several | 1 updateMany | Sessions created elsewhere (Supabase?) |
| CopilotContext | 1 (timeline/route.ts:138) | 0 | Single read query |
| DateReflection | 1 (emotional-push.ts) | 0 | Read-only |

**Note**: GHOST models are NOT to be deleted. They may be part of future roadmap. Documented here for architectural transparency.
