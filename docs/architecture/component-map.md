# Component Map

## Classification
- **ACTIVE**: Imported and rendered in production code
- **DEPRECATED**: Moved to src/deprecated/components/
- **ORPHAN**: Defined but never imported (identified during audit)

## ACTIVE Components (key components only)

| Component | File | Consumers | Status |
|-----------|------|-----------|--------|
| MessageBubble | chat/message-bubble.tsx | chat/[id]/page.tsx | ACTIVE |
| ChatInput | chat/chat-input.tsx | chat/[id]/page.tsx | ACTIVE |
| VoiceMessage | chat/VoiceMessage.tsx | chat/[id]/page.tsx | ACTIVE |
| MatchTimeline | chat/MatchTimeline.tsx | chat/[id]/page.tsx | ACTIVE |
| ConversationRoulette | chat/ConversationRoulette.tsx | chat/[id]/page.tsx | ACTIVE |
| MatchFeedbackDialog | match/MatchFeedbackDialog.tsx | chat/[id]/page.tsx | ACTIVE |
| DailyQuestionCard | daily-question/DailyQuestionCard.tsx | discover/page.tsx | ACTIVE |
| DailyCompatibilityCard | compatibility/DailyCompatibilityCard.tsx | discover/page.tsx | ACTIVE |
| CompatibilityScoreCard | compatibility/CompatibilityScoreCard.tsx | profile pages | ACTIVE |
| ProfileHighlights | profile/ProfileHighlights.tsx | profile/[id]/page.tsx | ACTIVE |
| FavoriteButton | profile/FavoriteButton.tsx | profile/[id]/page.tsx | ACTIVE |
| StreakCard | gamification/StreakCard.tsx | profile/page.tsx | ACTIVE |
| FirstWeekJourney | gamification/FirstWeekJourney.tsx | profile/page.tsx | ACTIVE |
| MatchScreen | ui/premium/MatchScreen.tsx | discover/page.tsx | ACTIVE |
| FloatingMatchCard | ui/premium/FloatingMatchCard.tsx | discover/page.tsx | ACTIVE |
| ProfileActions | match/ProfileActions.tsx | FloatingMatchCard.tsx | ACTIVE |
| PlusBadge | premium/PlusBadge.tsx | multiple | ACTIVE |
| UpgradePrompt | premium/UpgradePrompt.tsx | multiple | ACTIVE |
| TrustBadge | ui/premium/TrustBadge.tsx | profile page | ACTIVE |

## DEPRECATED Components (moved to src/deprecated/components/)

| Component | Original Path | Reason |
|-----------|--------------|--------|
| ConversationHealthCard | src/components/chat/ConversationHealthCard.tsx | 0 consumers |
| WellbeingDashboard | src/components/wellbeing/WellbeingDashboard.tsx | 0 consumers |
| DailyMissions | src/components/missions/DailyMissions.tsx | 0 consumers |
| DailyInsightCard | src/components/insights/DailyInsightCard.tsx | 0 consumers |
| ProgressDashboard | src/components/progress/ProgressDashboard.tsx | 0 consumers |
| ImpactShareable | src/components/community/ImpactShareable.tsx | 0 consumers |
| DateSignalPrompt | src/components/date-signal/DateSignalPrompt.tsx | 0 consumers |
| ExitSurvey | src/components/feedback/ExitSurvey.tsx | 0 consumers |
| TrustScoreCard | src/components/trust/TrustScoreCard.tsx | 0 consumers |
| VerificationBadge | src/components/verification/VerificationBadge.tsx | 0 consumers |
| PhotoQuality | src/components/photos/PhotoQuality.tsx | 0 consumers |
| AudioInsights | src/components/audio/AudioInsights.tsx | 0 consumers |
| SoftModal | src/components/ui/premium/SoftModal.tsx | 0 consumers |
| GradientBackground | src/components/ui/premium/GradientBackground.tsx | 0 consumers |
| premium-gate | src/components/ui/premium-gate.tsx | 0 consumers |
| BoostActivation | src/components/premium/BoostActivation.tsx | 0 consumers |
| ProfileQualityCard | src/components/profile/ProfileQualityCard.tsx | 0 consumers |
| FlowBoost | src/components/chat/boosts/FlowBoost.tsx | 0 consumers |
| ChatSuggestions | src/components/chat/suggestions/ChatSuggestions.tsx | 0 consumers |
| daily-card | src/components/rituals/daily-card.tsx | 0 consumers |
