'use server';

/**
 * @fileOverview AI-powered content moderation flow for filtering offensive messages.
 *
 * - filterOffensiveMessages - A function that filters potentially offensive content from a given text.
 * - FilterOffensiveMessagesInput - The input type for the filterOffensiveMessages function.
 * - FilterOffensiveMessagesOutput - The return type for the filterOffensiveMessages function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FilterOffensiveMessagesInputSchema = z.object({
  text: z.string().describe('El texto a verificar por contenido ofensivo.'),
});
export type FilterOffensiveMessagesInput = z.infer<typeof FilterOffensiveMessagesInputSchema>;

const FilterOffensiveMessagesOutputSchema = z.object({
  isOffensive: z.boolean().describe('Si el texto de entrada se considera ofensivo.'),
  filteredText: z
    .string()
    .describe('El texto filtrado, con las partes ofensivas reemplazadas o eliminadas.'),
});
export type FilterOffensiveMessagesOutput = z.infer<typeof FilterOffensiveMessagesOutputSchema>;

export async function filterOffensiveMessages(
  input: FilterOffensiveMessagesInput
): Promise<FilterOffensiveMessagesOutput> {
  return filterOffensiveMessagesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'filterOffensiveMessagesPrompt',
  input: {schema: FilterOffensiveMessagesInputSchema},
  output: {schema: FilterOffensiveMessagesOutputSchema},
  prompt: `Eres una IA de moderación de contenido que filtra mensajes ofensivos.

  Determina si el siguiente texto es ofensivo. Si lo es, devuelve verdadero para isOffensive y una versión filtrada del texto con las partes ofensivas reemplazadas por asteriscos. Si no es ofensivo, devuelve falso para isOffensive y el texto original para filteredText.

  Texto: {{{text}}}
  `, safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_ONLY_HIGH',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
  ],
});

const filterOffensiveMessagesFlow = ai.defineFlow(
  {
    name: 'filterOffensiveMessagesFlow',
    inputSchema: FilterOffensiveMessagesInputSchema,
    outputSchema: FilterOffensiveMessagesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
