import { z } from 'zod';

export const UserProfileSchema = z.object({
    displayName: z.string().min(2).max(50),
    age: z.number().min(18).max(100),
    gender: z.enum(['woman', 'man', 'non-binary']),
    seeking: z.enum(['women', 'men', 'all']),
    bio: z.string().max(500).optional(),
    interests: z.array(z.string()).max(10),
    values: z.array(z.string()).max(5),
    location: z.object({
        lat: z.number(),
        lng: z.number(),
        city: z.string()
    }).optional()
});

export const MessageSchema = z.object({
    content: z.string().min(1).max(1000),
    matchId: z.string(),
    type: z.enum(['text', 'image', 'icebreaker']).default('text')
});
