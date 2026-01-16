import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const metricsServerService = {
    async logEvent(userId: string, eventType: string, data: Record<string, any> = {}) {
        try {
            await adminDb.collection('engagement_logs').add({
                userId,
                eventType,
                ...data,
                timestamp: FieldValue.serverTimestamp()
            });

            // Update user's last retention flag if needed
            if (eventType === 'app_open') {
                await adminDb.collection('profiles').doc(userId).update({
                    lastActive: FieldValue.serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error logging metric:', error);
        }
    }
};
