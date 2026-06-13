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
 * Fallback template-based icebreaker generator.
 * Used when the AI model is unavailable or throws an error.
 */
function generateFallbackIcebreakers(
    userA: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] },
    userB: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] }
): string[] {
    const icebreakers: string[] = [];

    // Shared interests
    const sharedInterests = userA.interests.filter(i =>
        userB.interests.some(j => j.toLowerCase() === i.toLowerCase())
    );
    if (sharedInterests.length > 0) {
        const interest = sharedInterests[0];
        icebreakers.push(`Vi que a los dos les gusta ${interest} — ¿cuál fue la última vez que lo disfrutaste de verdad?`);
    }

    // Shared values
    const sharedValues = userA.values.filter(v =>
        userB.values.some(w => w.toLowerCase() === v.toLowerCase())
    );
    if (sharedValues.length > 0) {
        const value = sharedValues[0];
        icebreakers.push(`Me parece que ambos valoramos ${value}. ¿Cómo se refleja eso en tu día a día?`);
    }

    // Shared music
    const sharedMusic = userA.musicGenres.filter(m =>
        userB.musicGenres.some(n => n.toLowerCase() === m.toLowerCase())
    );
    if (sharedMusic.length > 0) {
        const genre = sharedMusic[0];
        icebreakers.push(`¡Música de ${genre} en común! ¿Cuál es esa canción que nunca pasa de moda para ti?`);
    }

    // Generic warm starters as padding
    const generics = [
        `Hola ${userB.displayName} 👋 ¿Qué es lo más interesante que te ha pasado esta semana?`,
        `De todo lo que tienes en tu perfil, ¿cuál es la parte que más te representa hoy?`,
        `Si pudieras hacer planes para este fin de semana sin límites, ¿qué harías?`,
    ];

    // Fill up to 3 icebreakers
    for (const g of generics) {
        if (icebreakers.length >= 3) break;
        icebreakers.push(g);
    }

    return icebreakers.slice(0, 3);
}

/**
 * Generate personalized icebreakers for a match.
 * Falls back to template-based generation if AI is unavailable.
 */
export async function generateIcebreakers(
    userA: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] },
    userB: { displayName: string; interests: string[]; values: string[]; bio: string; musicGenres: string[] }
): Promise<string[]> {
    try {
        const { output } = await icebreakerPrompt({ userA, userB });
        if (output?.icebreakers && output.icebreakers.length > 0) {
            return output.icebreakers;
        }
        // AI returned empty — use fallback
        return generateFallbackIcebreakers(userA, userB);
    } catch (err) {
        console.warn('[icebreaker-ai] AI failed, using template fallback:', err);
        return generateFallbackIcebreakers(userA, userB);
    }
}
