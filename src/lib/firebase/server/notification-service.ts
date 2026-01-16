import { adminDb, adminMessaging } from '../admin';

export const notificationServerService = {
    async sendPushToUser(userId: string, title: string, body: string, data?: Record<string, string>) {
        try {
            // 1. Get user tokens
            const tokensSnap = await adminDb.collection('fcm_tokens')
                .where('userId', '==', userId)
                .get();

            const tokens = tokensSnap.docs.map(doc => doc.id);
            if (tokens.length === 0) return;

            // 2. Send multi-cast
            const response = await adminMessaging.sendEachForMulticast({
                tokens,
                notification: { title, body },
                data: data || {},
                webpush: {
                    notification: {
                        icon: '/logo.png',
                        click_action: data?.url || '/'
                    }
                }
            });

            console.log(`Successfully sent ${response.successCount} notifications to user ${userId}`);

            // 3. Clean up invalid tokens
            if (response.failureCount > 0) {
                const tokensToRemove: string[] = [];
                response.responses.forEach((resp: any, idx: number) => {
                    if (!resp.success && (resp.error?.code === 'messaging/invalid-registration-token' || resp.error?.code === 'messaging/registration-token-not-registered')) {
                        tokensToRemove.push(tokens[idx]);
                    }
                });

                if (tokensToRemove.length > 0) {
                    const batch = adminDb.batch();
                    tokensToRemove.forEach(t => {
                        batch.delete(adminDb.collection('fcm_tokens').doc(t));
                    });
                    await batch.commit();
                }
            }
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
};
