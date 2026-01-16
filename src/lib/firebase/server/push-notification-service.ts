import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type PushPriority = 'emergency' | 'high' | 'normal' | 'low';

export interface PushMessage {
    userId: string;
    title: string;
    body: string;
    priority: PushPriority;
    category: 'safety' | 'match' | 'message' | 'community' | 'event' | 'growth';
    data?: Record<string, string>;
}

export const pushNotificationServerService = {
    async sendPrioritizedPush(message: PushMessage): Promise<void> {
        // 1. Anti-Fatigue Check
        const userRef = adminDb.collection('profiles').doc(message.userId);
        const userDoc = await userRef.get();
        const lastPush = userDoc.data()?.lastPushSentAt?.toDate() || new Date(0);

        const secondsSinceLastPush = (Date.now() - lastPush.getTime()) / 1000;

        // Skip if normal/low priority and sent too recently (e.g., < 30 mins)
        if (['normal', 'low'].includes(message.priority) && secondsSinceLastPush < 1800) {
            console.log(`Push throttled for user ${message.userId} (anti-fatigue)`);
            return;
        }

        // 2. Prioritization Logic (Mocking FCM call)
        console.log(`[PUSH] [${message.priority.toUpperCase()}] To: ${message.userId} - ${message.title}`);

        // 3. Update Last Sent
        await userRef.update({
            lastPushSentAt: FieldValue.serverTimestamp(),
            [`pushCount.${message.category}`]: FieldValue.increment(1)
        });

        // 4. Track Metric
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: message.priority === 'emergency' ? 'warn' : 'info',
            category: 'system',
            message: `Push Sent: ${message.category}`,
            userId: message.userId,
            details: { priority: message.priority }
        });
    }
};
