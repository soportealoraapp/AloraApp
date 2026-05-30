import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const dailyInsightPrompt = ai.definePrompt({
    name: 'dailyInsightPrompt',
    input: {
        schema: z.object({
            userName: z.string(),
            interests: z.array(z.string()),
            values: z.array(z.string()),
            lookingFor: z.string().optional(),
            recentActivity: z.string(),
            personalityHint: z.string().optional(),
        }),
    },
    output: {
        schema: z.object({
            reflection: z.string(),
            personalQuestion: z.string(),
            relationalInsight: z.string(),
            conversationTip: z.string(),
            emotionalTip: z.string(),
        }),
    },
    prompt: `Eres un relationship coach personal de {{userName}}. Genera un insight diario personalizado.

Sobre {{userName}}:
- Intereses: {{interests}}
- Valores: {{values}}
- Busca: {{lookingFor}}
- Actividad reciente: {{recentActivity}}
- Personalidad: {{personalHint}}

Genera 5 secciones (cada una 1-2 oraciones, máximo 80 caracteres cada una):

1. reflection: Reflexión diaria personal (NO genérica, basada en sus valores)
2. personalQuestion: Una pregunta personal para autoconocimiento
3. relationalInsight: Un insight sobre relaciones basado en su perfil
4. conversationTip: Un consejo práctico para conversaciones de dating
5. emotionalTip: Un consejo emocional para su bienestar

REGLAS:
- NO uses horóscopos ni frases motivacionales genéricas
- Sé específico y personalizado
- Tono cálido pero honesto
- En español natural
- NO uses emojis excesivos
- Cada sección debe ser útil y accionable`,
});

/**
 * Generate daily relationship insights for a user.
 */
export async function generateDailyInsight(user: {
    name: string;
    interests: string[];
    values: string[];
    lookingFor?: string;
    recentActivity: string;
    personalityHint?: string;
}) {
    const { output } = await dailyInsightPrompt({
        userName: user.name,
        interests: user.interests,
        values: user.values,
        lookingFor: user.lookingFor,
        recentActivity: user.recentActivity,
        personalityHint: user.personalityHint,
    });
    return output;
}
