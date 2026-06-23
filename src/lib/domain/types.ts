/**
 * Alora
 * © 2026 Alora Team. All rights reserved.
 *
 * Soporte: soporte.alora.app@gmail.com
 *
 * Desarrollado por:
 * - Alejandro Pérez Vázquez (CEO y fundador)
 * - Caleb Zacarías García
 * - Juan Carlos Moreno López
 * - Erik Barrera Barrera
 */

export type UserId = string;
export type Url = string;
export type ConnectionIntent = 'dating' | 'friendship';

export interface SpotifyTrackSnapshot {
    id: string;
    name: string;
    artists: string[];
    uri?: string;
    externalUrl?: string;
    imageUrl?: string | null;
}

export interface SpotifyArtistSnapshot {
    id: string;
    name: string;
    genres?: string[];
    externalUrl?: string;
    imageUrl?: string | null;
}

export interface SpotifyProfileSnapshot {
    topTracks: SpotifyTrackSnapshot[];
    topArtists: SpotifyArtistSnapshot[];
    playlistId?: string | null;
    playlistUrl?: string | null;
    lastSyncedAt?: string | Date | null;
}

// Base User (from Auth/System)
export interface User {
    id: UserId;
    email: string;
    name?: string;
    photoUrl?: Url; // Legacy support or Auth provider photo
    isVerified: boolean;
    createdAt: Date;
}

// Full Profile (Core)
export interface UserProfile extends User {
    displayName: string;
    bio?: string;
    age: number;
    gender: 'woman' | 'man' | 'non-binary' | string;
    seeking: 'women' | 'men' | 'all' | 'everyone';
    photos: Url[];
    interests: string[];
    values: string[];
    city?: string;

    // Rich Profile Fields (Dating App Essentials)
    zodiacSign?: string;
    education?: string;
    smoking?: 'no' | 'yes' | 'occasionally' | string;
    drinking?: 'no' | 'yes' | 'occasionally' | string;
    children?: 'yes' | 'no' | 'maybe' | string;
    religion?: string;
    personalGuide?: { title: string; description: string }[];
    musicGenres?: string[];
    status?: string;

    // Location (structured)
    cityId?: string;
    countryCode?: string;
    stateCode?: string;
    latitude?: number;
    longitude?: number;

    // Relationship goals
    lookingFor?: string;
    connectionModes?: ConnectionIntent[];
    spotify?: SpotifyProfileSnapshot | null;

    // Status
    isCompleted?: boolean;
    subscriptionStatus?: 'free' | 'plus';
    verificationStatus?: 'verified' | 'unverified'; // UI helper
    trustStatus?: 'clean' | 'watchlist' | 'restricted' | 'banned';

    // Daily likes tracking
    dailyLikesUsed?: number;
    dailyLikesResetAt?: Date;

    // Boost tracking
    boostExpiresAt?: Date | string | null;
    lastBoostAt?: Date | string | null;
    totalBoosts?: number;

    // Travel mode
    travelModeEnabled?: boolean;
    travelCity?: string;
    travelCountryCode?: string;
    travelLatitude?: number;
    travelLongitude?: number;
    travelStartedAt?: Date | string | null;

    // Rewind
    lastSwipeId?: string;
    lastSwipeAt?: Date | string | null;
    rewindsUsed?: number;
    rewindsResetAt?: Date;

    // Superlikes
    superlikesRemaining?: number;

    // Streaks
    currentStreak?: number;
    longestStreak?: number;
    lastCheckInAt?: Date | string | null;
    streakRewardsClaimed?: string[];

    // v3.x
    experimentalGroup?: 'A' | 'B';
    compatibility?: number; // UI helper
    completenessScore?: number; // v3.8.0
    incomplete_media?: boolean; // v3.9.2 — true if profile has pending media upload

    // Discover V3 retention signals
    activeNow?: boolean;
    highResponseRate?: boolean;
    sharedInterests?: number;
    messageResponseRate?: number | null;
    lastActiveHours?: number | null;
    voiceIntro?: string;
    quizArchetype?: string | null;
    quizScore?: number | null;
    latestAnswer?: {
        questionId: string;
        question: string | null;
        category: string | null;
        answer: string;
        createdAt: string;
    } | null;
}

export interface Match {
    id: string;
    users: [UserId, UserId];
    usersData?: Record<UserId, UserProfile | any>;
    createdAt: Date;
    updatedAt?: Date;
    lastMessage?: Message;
    stage?: string;
    intent?: ConnectionIntent;
    compatibility?: number;
    mutedUntil?: string | Date | null;
    mutedByUserId?: string | null;
    partner?: {
        id: string;
        displayName?: string;
        photoURL?: string | null;
        photos?: string[];
        isVerified?: boolean;
    };
    unreadCount?: number;
}

export interface Message {
    id: string;
    matchId: string;
    senderId: UserId;
    content: string;
    createdAt: Date;
    readAt?: Date;
    type: 'text' | 'image' | 'icebreaker' | 'voice';
    status?: 'sent' | 'delivered' | 'read' | 'pending' | 'flagged' | 'failed';
    reactions?: Record<string, string>;
}

export interface AuditLog {
    id: string;
    action: string;
    userId: UserId;
    details?: any;
    timestamp: Date;
}

export interface Interaction {
    id: string;
    fromUserId: string;
    toUserId: string;
    type: 'like' | 'pass' | 'superlike';
    intent: ConnectionIntent;
    createdAt: Date;
}
