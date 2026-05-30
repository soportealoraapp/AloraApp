import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const emotionalOnboardingPrompt = ai.definePrompt({
    name: 'emotionalOnboardingPrompt',
    input: {
        schema: z.object({
            goals: z.array(z.string()),
            values: z.array(z.string()),
            personality: z.string(),
            lookingFor: z.string(),
            avoidInPartner: z.array(z.string()),
        }),
    },
    output: {
        schema: z.object({
            summary: z.string(),
            insight: z.string(),
            advice: z.string(),
        }),
    },
    prompt: `Basado en estas respuestas de onboarding, genera un resumen personalizado.

Objetivos: {{goals}}
Valores: {{values}}
Personalidad: {{personality}}
Busca: {{lookingFor}}
Quiere evitar: {{avoidInPartner}}

Genera:
1. summary: Un resumen de 2-3 oraciones describiendo a esta persona en el contexto de dating. Ejemplo: "Parece que valoras la estabilidad, las conversaciones profundas y las relaciones a largo plazo."
2. insight: Un insight personalizado sobre qué tipo de conexión le funcionaría mejor
3. advice: Un consejo específico para su experiencia en la app

Tono: cálido, honesto, personal. Sin clichés.`,
});

/**
 * Generate emotional onboarding summary.
 */
export async function generateOnboardingSummary(data: {
    goals: string[];
    values: string[];
    personality: string;
    lookingFor: string;
    avoidInPartner: string[];
}) {
    const { output } = await emotionalOnboardingPrompt(data);
    return output;
}
