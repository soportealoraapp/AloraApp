import { z } from 'zod';

const ALLOWED_GENDERS = ['woman', 'man', 'non-binary', 'female', 'male'] as const;
const ALLOWED_SEEKING = ['women', 'men', 'all', 'everyone'] as const;
const MAX_PHOTOS = 6;
const MAX_INTERESTS = 10;
const MAX_VALUES = 5;
const MAX_MUSIC_GENRES = 5;
const MAX_BIO_LENGTH = 500;
const MAX_DISPLAY_NAME_LENGTH = 50;
const MAX_CITY_LENGTH = 100;
const MIN_AGE = 18;
const MAX_AGE = 120;

export const EditableProfileSchema = z.object({
    displayName: z.string().min(1, 'Display name is required').max(MAX_DISPLAY_NAME_LENGTH).trim(),
    bio: z.string().max(MAX_BIO_LENGTH, `Bio must be ${MAX_BIO_LENGTH} characters or less`).trim().optional().default(''),
    age: z.number().int().min(MIN_AGE, `Must be at least ${MIN_AGE}`).max(MAX_AGE, `Must be at most ${MAX_AGE}`),
    gender: z.string().min(1).optional(),
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
    for (const [key, value] of Object.entries(body)) {
        if (allowedKeys.has(key) && !BLOCKED_FIELDS.has(key)) {
            allowed[key] = value;
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
    type: z.enum(['text', 'image', 'icebreaker']).default('text')
});

export const LikeSchema = z.object({
    toUserId: z.string().uuid(),
    type: z.enum(['like', 'superlike', 'pass']).default('like'),
});
