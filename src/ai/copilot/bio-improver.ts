import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const bioImproverPrompt = ai.definePrompt({
    name: 'bioImproverPrompt',
    input: {
        schema: z.object({
            currentBio: z.string(),
            interests: z.array(z.string()),
            values: z.array(z.string()),
            city: z.string().optional(),
            lookingFor: z.string().optional(),
        }),
    },
    output: {
        schema: z.object({
            improvedBio: z.string(),
            changes: z.array(z.string()),
        }),
    },
    prompt: `Eres un experto en copywriting para perfiles de dating. Tu tarea es mejorar esta biografía.

Biografía actual: {{currentBio}}
Intereses: {{interests}}
Valores: {{values}}
Ciudad: {{city}}
Qué busca: {{lookingFor}}

Reglas:
1. Mantén la personalidad y el tono originales
2. Hazla más atractiva y específica
3. Máximo 200 caracteres
4. NO uses clichés como "me gusta viajar" o "amo la vida"
5. Sé auténtico, no genérico
6. Incluye un gancho que invite a conversar

Responde con:
1. improvedBio: la biografía mejorada
2. changes: lista de cambios realizados`,
});

/**
 * Improve a user's bio using AI.
 */
export async function improveBio(bio: {
    currentBio: string;
    interests: string[];
    values: string[];
    city?: string;
    lookingFor?: string;
}): Promise<{ improvedBio: string; changes: string[] }> {
    const { output } = await bioImproverPrompt(bio);
    return output!;
}
