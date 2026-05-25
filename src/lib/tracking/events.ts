export const AnalyticsEvents = {
    // Onboarding
    ONBOARDING_STARTED: 'onboarding_started',
    ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
    ONBOARDING_DROPOFF: 'onboarding_dropoff',
    ONBOARDING_COMPLETED: 'onboarding_completed',

    // Profile
    PROFILE_COMPLETION_UPDATED: 'profile_completion_updated',
    PROFILE_PHOTO_ADDED: 'profile_photo_added',
    PROFILE_PHOTO_REMOVED: 'profile_photo_removed',
    PROFILE_EDITED: 'profile_edited',

    // Discovery
    DISCOVER_FEED_LOADED: 'discover_feed_loaded',
    DISCOVER_FEED_EXHAUSTED: 'discover_feed_exhausted',
    DISCOVER_SWIPE_LEFT: 'discover_swipe_left',
    DISCOVER_SWIPE_RIGHT: 'discover_swipe_right',

    // Likes & Matches
    LIKE_SENT: 'like_sent',
    SUPERLIKE_SENT: 'superlike_sent',
    PASS_SENT: 'pass_sent',
    MATCH_CREATED: 'match_created',

    // Chat
    CHAT_MESSAGE_SENT: 'chat_message_sent',
    CHAT_FIRST_MESSAGE: 'chat_first_message',
    CHAT_REPLY_RECEIVED: 'chat_reply_received',

    // Safety
    USER_REPORTED: 'user_reported',
    USER_BLOCKED: 'user_blocked',
    USER_MUTED: 'user_muted',
    USER_HIDDEN: 'user_hidden',

    // Verification
    VERIFICATION_SUBMITTED: 'verification_submitted',
    VERIFICATION_APPROVED: 'verification_approved',
    VERIFICATION_REJECTED: 'verification_rejected',

    // Engagement
    SESSION_STARTED: 'session_started',
    SESSION_ENDED: 'session_ended',
    APP_BACKGROUNDED: 'app_backgrounded',
    APP_FOREGROUNDED: 'app_foregrounded',
} as const;

export type AnalyticsEvent = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
