import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const profileCoachPrompt = ai.definePrompt({
    name: 'profileCoachPrompt',
    input: {
        schema: z.object({
            displayName: z.string(),
            bio: z.string(),
            interests: z.array(z.string()),
            values: z.array(z.string()),
            photos: z.array(z.string()),
            education: z.string().optional(),
            city: z.string().optional(),
        }),
    },
    output: {
        schema: z.object({
            score: z.number().min(0).max(100),
            recommendations: z.array(z.string()),
            strengths: z.array(z.string()),
        }),
    },
    prompt: `Eres un coach de perfiles de dating experto. Analiza este perfil y dame recomendaciones específicas y accionables.

Perfil:
- Nombre: {{displayName}}
- Biografía: {{bio}}
- Intereses: {{interests}}
- Valores: {{values}}
- Fotos: {{photos.length}} fotos
- Educación: {{education}}
- Ciudad: {{city}}

Responde con:
1. score (0-100): qué tan atractivo es el perfil actualmente
2. recommendations: 3-5 recomendaciones específicas y accionables (NO genéricas)
3. strengths: 2-3 cosas que ya están bien

Sé directo, honesto y específico. No halagues artificialmente.`,
});

/**
 * Analyze a user's profile and provide improvement recommendations.
 */
export async function analyzeProfile(profile: {
    displayName: string;
    bio: string;
    interests: string[];
    values: string[];
    photos: string[];
    education?: string;
    city?: string;
}): Promise<{ score: number; recommendations: string[]; strengths: string[] }> {
    const { output } = await profileCoachPrompt(profile);
    return output!;
}
