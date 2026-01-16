import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface UnsentLetter {
    userId: string;
    content: string;
    createdAt: Date;
}

export const closureToolsServerService = {
    async createEphemeralUnsentLetter(userId: string, content: string): Promise<void> {
        // Unsent letters are conceptually private. We log the action, but store the content minimally or not at all.
        // For this implementation, we log that a closure action happened.
        const logRef = adminDb.collection('profiles').doc(userId).collection('closure_actions').doc();

        await logRef.set({
            userId,
            action: 'unsent_letter_created',
            timestamp: FieldValue.serverTimestamp()
        });

        console.log(`[CLOSURE] User ${userId} created an unsent letter. Action logged for resilience tracking.`);
    },

    async getClosureRitual(userId: string): Promise<string[]> {
        return [
            "Tómate 5 minutos para respirar profundamente.",
            "Escribe lo que sientes en el espacio de 'Cartas No Enviadas'. No te guardes nada.",
            "Al terminar, cierra la sesión. El texto desaparecerá, simbolizando el soltar.",
            "Haz algo amable por ti mismo hoy (un café, un paseo, música que te guste)."
        ];
    }
};
