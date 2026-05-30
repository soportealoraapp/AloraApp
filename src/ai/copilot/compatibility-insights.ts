import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const compatibilityInsightsPrompt = ai.definePrompt({
    name: 'compatibilityInsightsPrompt',
    input: {
        schema: z.object({
            userA: z.object({
                displayName: z.string(),
                interests: z.array(z.string()),
                values: z.array(z.string()),
                bio: z.string(),
                lookingFor: z.string().optional(),
            }),
            userB: z.object({
                displayName: z.string(),
                interests: z.array(z.string()),
                values: z.array(z.string()),
                bio: z.string(),
                lookingFor: z.string().optional(),
            }),
            scores: z.object({
                values: z.number(),
                relationshipGoals: z.number(),
                personality: z.number(),
                interests: z.number(),
                lifestyle: z.number(),
            }),
        }),
    },
    output: {
        schema: z.object({
            insights: z.array(z.string()),
            strengths: z.array(z.string()),
            concerns: z.array(z.string()),
        }),
    },
    prompt: `Eres un relationship coach experto. Analiza la compatibilidad entre estas dos personas y da insights honestos.

{{userA.displayName}}:
- Intereses: {{userA.interests}}
- Valores: {{userA.values}}
- Bio: {{userA.bio}}
- Busca: {{userA.lookingFor}}

{{userB.displayName}}:
- Intereses: {{userB.interests}}
- Valores: {{userB.values}}
- Bio: {{userB.bio}}
- Busca: {{userB.lookingFor}}

Scores de compatibilidad:
- Valores: {{scores.values}}%
- Objetivos: {{scores.relationshipGoals}}%
- Personalidad: {{scores.personality}}%
- Intereses: {{scores.interests}}%
- Estilo de vida: {{scores.lifestyle}}%

Responde con:
1. insights: 3-5 oraciones explicando POR QUÉ son compatibles o no, con datos específicos
2. strengths: 2-3 fortalezas de esta pareja potencial
3. concerns: 1-2 áreas de preocupación (si las hay)

Sé honesto, no halagues artificialmente. Si hay diferencias importantes, dilo.`,
});

/**
 * Generate AI-powered compatibility insights.
 */
export async function generateCompatibilityInsights(
    userA: { displayName: string; interests: string[]; values: string[]; bio: string; lookingFor?: string },
    userB: { displayName: string; interests: string[]; values: string[]; bio: string; lookingFor?: string },
    scores: { values: number; relationshipGoals: number; personality: number; interests: number; lifestyle: number }
): Promise<{ insights: string[]; strengths: string[]; concerns: string[] }> {
    const { output } = await compatibilityInsightsPrompt({ userA, userB, scores });
    return output!;
}
