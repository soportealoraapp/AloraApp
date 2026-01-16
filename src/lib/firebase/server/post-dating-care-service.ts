import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type WellBeingEvent = 'ghosting_detected' | 'unmatch_significant' | 'relationship_ended' | 'rejection_confirmed';

export interface CareSession {
    userId: string;
    eventType: WellBeingEvent;
    checkInResponse?: string;
    timestamp: Date;
}

export const postDatingCareServerService = {
    async logCareTrigger(userId: string, eventType: WellBeingEvent): Promise<void> {
        const careRef = adminDb.collection('profiles').doc(userId).collection('wellbeing_logs').doc();

        await careRef.set({
            userId,
            eventType,
            timestamp: FieldValue.serverTimestamp()
        });

        // Trigger a gentle push if needed
        console.log(`[WELLBEING] Triggered ${eventType} for user ${userId}. Prompting check-in...`);
    },

    async getValidationPrompt(eventType: WellBeingEvent): Promise<string> {
        switch (eventType) {
            case 'ghosting_detected':
                return "Parece que las cosas se han enfriado en una de tus conversaciones. Es normal sentirse un poco frustrado, pero recuerda que esto no define tu valor.";
            case 'unmatch_significant':
                return "A veces las conexiones se cortan sin previo aviso. Es parte del proceso, y aquí estamos para acompañarte si te apetece un respiro.";
            case 'relationship_ended':
                return "Cerrar un ciclo lleva tiempo. Has hecho bien en priorizar tu honestidad. ¿Cómo te sientes hoy?";
            default:
                return "¿Cómo va todo? Recuerda que tu bienestar es lo más importante.";
        }
    }
};
