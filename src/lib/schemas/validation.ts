import { z } from 'zod';
import { MAX_INTERESTS, MAX_VALUES, MAX_MUSIC_GENRES } from '@/lib/constants/preferences';

// Canonical gender vocabulary. Legacy values ('male' / 'female') are normalized
// to ('man' / 'woman') by `normalizeGender` before they ever reach the DB or
// the validation pipeline. New code MUST use these three values only.
export const ALLOWED_GENDERS = ['woman', 'man', 'non-binary'] as const;
export type Gender = (typeof ALLOWED_GENDERS)[number];

const ALLOWED_SEEKING = ['women', 'men', 'all', 'everyone'] as const;
const ALLOWED_CONNECTION_INTENTS = ['dating', 'friendship'] as const;
const MAX_PHOTOS = 6;
const MAX_BIO_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_CITY_LENGTH = 100;
const MIN_AGE = 18;
const MAX_AGE = 120;

/**
 * Strip HTML tags and dangerous characters from user-generated content.
 * Prevents stored XSS in display names, bios, and messages.
 */
export function stripHtml(input: string): string {
    return input
        .replace(/<[^>]*>/g, '')           // Remove HTML tags
        .replace(/&[a-zA-Z]+;/g, '')       // Remove HTML entities
        .replace(/javascript:/gi, '')       // Remove javascript: URIs
        .replace(/on\w+\s*=/gi, '')         // Remove on* event handlers
        .replace(/data:/gi, '')             // Remove data: URIs
        .replace(/vbscript:/gi, '')         // Remove vbscript: URIs
        .trim();
}

export const EditableProfileSchema = z.object({
    displayName: z.string().min(1, 'Display name is required').max(MAX_DISPLAY_NAME_LENGTH).trim().transform(stripHtml),
    bio: z.string().max(MAX_BIO_LENGTH, `Bio must be ${MAX_BIO_LENGTH} characters or less`).trim().optional().default('').transform(stripHtml),
    age: z.number().int().min(MIN_AGE, `Must be at least ${MIN_AGE}`).max(MAX_AGE, `Must be at most ${MAX_AGE}`).optional(),
    gender: z.enum(ALLOWED_GENDERS).optional(),
    photos: z.array(z.string().url('Each photo must be a valid URL')).max(MAX_PHOTOS, `Maximum ${MAX_PHOTOS} photos`).optional().default([]),
    interests: z.array(z.string()).max(MAX_INTERESTS).optional().default([]),
    values: z.array(z.string()).max(MAX_VALUES).optional().default([]),
    city: z.string().max(MAX_CITY_LENGTH).trim().optional().default(''),
    zodiacSign: z.string().optional().default(''),
    education: z.string().optional().default(''),
    smoking: z.string().optional().default(''),
    drinking: z.string().optional().default(''),
    children: z.string().optional().default(''),
    religion: z.string().optional().default(''),
    musicGenres: z.array(z.string()).max(MAX_MUSIC_GENRES).optional().default([]),
    status: z.string().max(50).optional().default(''),
    cityId: z.string().optional().default(''),
    countryCode: z.string().optional().default(''),
    stateCode: z.string().optional().default(''),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
    lookingFor: z.string().optional().default(''),
    connectionModes: z.array(z.enum(ALLOWED_CONNECTION_INTENTS)).min(1).max(2).optional().default(['dating']),
    voiceIntro: z.string().url('Voice intro must be a valid URL').nullable().optional(),
    voiceIntroDuration: z.number().nullable().optional(),
}).strict('Unexpected fields are not allowed');

export type EditableProfile = z.infer<typeof EditableProfileSchema>;

export const BLOCKED_FIELDS = new Set([
    'userId', 'id', 'createdAt', 'updatedAt', 'deletedAt',
    'isVerified', 'reputationScore', 'subscriptionStatus',
    'trustStatus', 'isShadowBanned', 'incomplete_media',
    'lastActiveAt', 'experimentalGroup', 'compatibility',
    'completenessScore', 'verificationStatus'
]);

export function sanitizeProfileUpdates(body: Record<string, unknown>): Record<string, unknown> {
    const allowed: Record<string, unknown> = {};
    const allowedKeys = new Set(Object.keys(EditableProfileSchema.shape));
    // Text fields that should be sanitized against XSS
    const textFields = new Set(['displayName', 'bio', 'status', 'city', 'zodiacSign', 'education', 'smoking', 'drinking', 'children', 'religion']);
    // Array fields where each element should be sanitized
    const arrayFields = new Set(['interests', 'values', 'musicGenres']);
    for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.has(key) && !BLOCKED_FIELDS.has(key)) {
            // Strip HTML from all text fields to prevent stored XSS
            if (textFields.has(key) && typeof value === 'string') {
                allowed[key] = stripHtml(value);
            } else if (arrayFields.has(key) && Array.isArray(value)) {
                // Sanitize each element in array fields
                allowed[key] = value.map(item => typeof item === 'string' ? stripHtml(item) : item);
            } else {
                allowed[key] = value;
            }
        }
    }
    return allowed;
}

export const UploadSchema = z.object({
    files: z.array(z.instanceof(File)).max(MAX_PHOTOS).optional(),
});

export const MessageSchema = z.object({
    content: z.string().min(1).max(1000),
    matchId: z.string().uuid(),
    receiverId: z.string().optional(),
    type: z.enum(['text', 'image', 'icebreaker', 'voice']).default('text')
});

export const LikeSchema = z.object({
    toUserId: z.string().uuid(),
    type: z.enum(['like', 'superlike', 'pass']).default('like'),
    intent: z.enum(ALLOWED_CONNECTION_INTENTS).default('dating'),
});

/**
 * Normalize any legacy gender string ('male' / 'female' / mixed case) to the
 * canonical vocabulary. Returns `null` for empty / unknown values so callers
 * can decide what to do.
 */
export function normalizeGender(value: string | null | undefined): Gender | null {
    if (!value) return null;
    const v = value.toLowerCase().trim();
    if (v === 'woman' || v === 'female') return 'woman';
    if (v === 'man' || v === 'male') return 'man';
    if (v === 'non-binary' || v === 'nonbinary' || v === 'nb') return 'non-binary';
    return null;
}

/**
 * True iff a (sender, receiver) pair is a heterosexual matchup under the
 * canonical vocabulary. Non-binary and unknown values are never "hetero".
 */
export function isHeteroMatch(
    senderGender: string | null | undefined,
    receiverGender: string | null | undefined
): boolean {
    const a = normalizeGender(senderGender);
    const b = normalizeGender(receiverGender);
    if (!a || !b) return false;
    if (a === 'non-binary' || b === 'non-binary') return false;
    return a !== b;
}
