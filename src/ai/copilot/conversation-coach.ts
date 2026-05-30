import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const conversationCoachPrompt = ai.definePrompt({
    name: 'conversationCoachPrompt',
    input: {
        schema: z.object({
            messages: z.array(z.object({
                sender: z.string(),
                content: z.string(),
                timestamp: z.string(),
            })),
            partnerProfile: z.object({
                displayName: z.string(),
                interests: z.array(z.string()),
                bio: z.string(),
            }),
        }),
    },
    output: {
        schema: z.object({
            suggestions: z.array(z.string()),
            warnings: z.array(z.string()),
            nextQuestions: z.array(z.string()),
        }),
    },
    prompt: `Eres un coach de conversaciones de dating. Analiza esta conversación y da sugerencias prácticas.

Conversación (últimos mensajes):
{{#each messages}}
- {{sender}}: {{content}}
{{/each}}

Perfil de la otra persona:
- Nombre: {{partnerProfile.displayName}}
- Intereses: {{partnerProfile.interests}}
- Bio: {{partnerProfile.bio}}

Responde con:
1. suggestions: 2-3 formas de continuar la conversación (específicas, no genéricas)
2. warnings: 1-2 cosas a evitar (si las hay)
3. nextQuestions: 2-3 preguntas específicas basadas en el perfil de la otra persona

Sé práctico y específico. NO sugieras "hola, ¿cómo estés?" o cosas genéricas.`,
});

/**
 * Get conversation coaching advice.
 */
export async function getConversationCoaching(
    messages: { sender: string; content: string; timestamp: string }[],
    partnerProfile: { displayName: string; interests: string[]; bio: string }
): Promise<{ suggestions: string[]; warnings: string[]; nextQuestions: string[] }> {
    const { output } = await conversationCoachPrompt({ messages, partnerProfile });
    return output!;
}
