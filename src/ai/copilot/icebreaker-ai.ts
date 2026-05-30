import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const icebreakerPrompt = ai.definePrompt({
    name: 'icebreakerPrompt',
    input: {
        schema: z.object({
            userA: z.object({
                displayName: z.string(),
                interests: z.array(z.string()),
                values: z.array(z.string()),
                bio: z.string(),
                musicGenres: z.array(z.string()),
            }),
            userB: z.object({
                displayName: z.string(),
                interests: z.array(z.string()),
                values: z.array(z.string()),
                bio: z.string(),
                musicGenres: z.array(z.string()),
            }),
        }),
    },
    output: {
        schema: z.object({
            icebreakers: z.array(z.string()),
        }),
    },
    prompt: `Eres un experto en crear conversaciones genuinas en dating. Genera 3 mensajes personalizados para iniciar una conversación entre estas dos personas.

Persona A: {{userA.displayName}}
- Intereses: {{userA.interests}}
- Valores: {{userA.values}}
- Bio: {{userA.bio}}
- Música: {{userA.musicGenres}}

Persona B: {{userB.displayName}}
- Intereses: {{userB.interests}}
- Valores: {{userB.values}}
- Bio: {{userB.bio}}
- Música: {{userB.musicGenres}}

Reglas:
1. Usa intereses o valores compartidos
2. Menciona algo específico del perfil (no genérico)
3. Haz una pregunta que invite a responder
4. Sé auténtico, no uses líneas de reciclaje
5. Usa un tono ligero y amigable
6. Máximo 2 oraciones por mensaje

Genera 3 opciones diferentes con estilos variados.`,
});

/**
 * Generate personalized icebreakers for a match.
 */
export async function generateIcebreakers(
    userA: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] },
    userB: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] }
): Promise<string[]> {
    const { output } = await icebreakerPrompt({ userA, userB });
    return output?.icebreakers || [];
}
