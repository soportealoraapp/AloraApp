export const AnalyticsEvents = {
    // Onboarding
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
    ONBOARDING_COMPLETED: 'onboarding_completed',
    ONBOARDING_ABANDONED: 'onboarding_abandoned',

    // Profile
    PROFILE_VIEWED: 'profile_viewed',
    PROFILE_EDITED: 'profile_edited',
    PROFILE_PHOTO_ADDED: 'profile_photo_added',

    // Discovery
    LIKE_SENT: 'like_sent',
    PASS_SENT: 'pass_sent',
    SUPERLIKE_SENT: 'flechado_sent',
    REWIND_USED: 'rewind_used',

    // Matching
    MATCH_CREATED: 'match_created',
    FIRST_MATCH: 'first_match',

    FIRST_MESSAGE: 'first_message',
    /** @deprecated Use FIRST_MESSAGE */
    FIRST_MESSAGE_SENT: 'first_message',
    FIRST_REPLY: 'first_reply',
    /** @deprecated Use FIRST_REPLY */
    FIRST_REPLY_RECEIVED: 'first_reply',

    // Conversations
    CONVERSATION_STARTED: 'conversation_started',
    CONVERSATION_MILESTONE: 'conversation_milestone',

    // Retention
    DAILY_ACTIVE: 'daily_active',
    WEEKLY_ACTIVE: 'weekly_active',
    MONTHLY_ACTIVE: 'monthly_active',

    // Premium
    PAYWALL_VIEWED: 'paywall_viewed',
    PLUS_STARTED: 'plus_started',
    PLUS_CANCELLED: 'plus_cancelled',

    // Boost
    BOOST_ACTIVATED: 'boost_activated',

    // Streak
    STREAK_CHECKIN: 'streak_checkin',

    // Daily
    DAILY_QUESTION_ANSWERED: 'daily_question_answered',
    DAILY_COMPATIBILITY_VIEWED: 'daily_compatibility_viewed',

    // Safety
    USER_REPORTED: 'user_reported',
    USER_BLOCKED: 'user_blocked',

    // Feedback
    FEEDBACK_SUBMITTED: 'feedback_submitted',

    // Travel
    TRAVEL_MODE_ACTIVATED: 'travel_mode_activated',
    TRAVEL_MODE_DEACTIVATED: 'travel_mode_deactivated',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
