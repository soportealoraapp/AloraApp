import { adminDb } from '../admin';
import { UserProfile, UserCompatibilityProfile } from '../types';
import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { FieldValue } from 'firebase-admin/firestore';

export const icebreakerServerService = {
    async generateIcebreakers(matchId: string, userId: string, otherUserId: string): Promise<string[]> {
        try {
            // 1. Check Cache
            const matchRef = adminDb.collection('matches').doc(matchId);
            const cacheRef = matchRef.collection('icebreakers').doc('latest');
            const cacheDoc = await cacheRef.get();

            if (cacheDoc.exists) {
                const data = cacheDoc.data();
                const createdAt = data?.createdAt?.toDate();
                if (createdAt && (Date.now() - createdAt.getTime() < 1000 * 60 * 60 * 24 * 7)) {
                    return data?.suggestions || [];
                }
            }

            // 2. Fetch User Data
            const [userDoc, otherDoc, compDoc, otherCompDoc] = await Promise.all([
                adminDb.collection('profiles').doc(userId).get(),
                adminDb.collection('profiles').doc(otherUserId).get(),
                adminDb.collection('user_compatibility').doc(userId).get(),
                adminDb.collection('user_compatibility').doc(otherUserId).get()
            ]);

            const user = userDoc.data() as UserProfile;
            const other = otherDoc.data() as UserProfile;
            const userComp = compDoc.data() as UserCompatibilityProfile;
            const otherComp = otherCompDoc.data() as UserCompatibilityProfile;

            // 3. Find Commonalities
            const commonInterests = user.interests.filter(i => other.interests.includes(i));
            const commonValues = user.values.filter(v => other.values.includes(v));

            // 4. Generate with Gemini
            const prompt = `
                Eres un experto en relaciones de la app de citas Alora. Tu objetivo es generar 3 icebreakers (rompehielos) innovadores y naturales para dos personas que acaban de hacer match.
                
                Contexto Usuario 1: Intereses: ${user.interests.join(', ')}. Valores: ${user.values.join(', ')}.
                Contexto Usuario 2: Intereses: ${other.interests.join(', ')}. Valores: ${other.values.join(', ')}.
                
                Cosas en común: Intereses: ${commonInterests.join(', ')}. Valores: ${commonValues.join(', ')}.
                
                Reglas:
                - Sé empático, ligero y original. Nada de frases cliché.
                - Deben ser abiertos (preguntas) para invitar a la respuesta.
                - En español de España/Latino neutro y natural.
                - Cortos y directos.
                
                Devuelve solo un array JSON de strings.
            `;

            const result = await ai.generate({
                model: 'googleai/gemini-2.0-flash',
                prompt,
                config: {
                    temperature: 0.8
                }
            });

            const suggestions = JSON.parse(result.text || '[]') as string[];

            // 5. Cache Results
            await cacheRef.set({
                suggestions,
                createdAt: FieldValue.serverTimestamp()
            });

            // 6. Log activity
            await adminDb.collection('ai_logs').add({
                type: 'icebreaker_generation',
                matchId,
                commonCount: commonInterests.length + commonValues.length,
                timestamp: FieldValue.serverTimestamp()
            });

            // 6. Log engagement metric
            const { metricsServerService } = await import('./metrics-service');
            await metricsServerService.logEvent(userId, 'icebreaker_generated', { matchId });

            return suggestions;
        } catch (error) {
            console.error('Error generating icebreakers:', error);
            return [
                "¡Hola! He visto que compartimos varios intereses, ¿cuál es tu favorito?",
                "¡Qué buen match! ¿Cómo va tu día?",
                "Me ha encantado tu perfil, ¿qué planes tienes para hoy?"
            ];
        }
    }
};
