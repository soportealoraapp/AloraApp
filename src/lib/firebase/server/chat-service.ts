import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Message, UserProfile } from '../types';

export const chatServerService = {
    async sendMessage(
        matchId: string,
        senderId: string,
        receiverId: string,
        text: string,
        type: 'text' | 'icebreaker' = 'text'
    ): Promise<Message> {
        try {
            // 1. Women First Check
            const matchRef = adminDb.collection('matches').doc(matchId);
            const matchDoc = await matchRef.get();
            if (!matchDoc.exists) throw new Error("Match no encontrado.");

            const messagesQuery = adminDb.collection('messages')
                .where('matchId', '==', matchId)
                .limit(1);
            const existingMessages = await messagesQuery.get();

            if (existingMessages.empty) {
                const senderDoc = await adminDb.collection('profiles').doc(senderId).get();
                const senderProfile = senderDoc.data() as UserProfile;
                if (senderProfile?.gender !== 'woman') {
                    throw new Error("Solo las mujeres pueden iniciar la conversación.");
                }
            }

            // 2. Initial Message Persistence (Marked as pending)
            const messageData = {
                matchId,
                senderId,
                receiverId,
                text,
                isFiltered: false,
                status: 'pending',
                type,
                createdAt: FieldValue.serverTimestamp(),
            };

            const messageRef = await adminDb.collection('messages').add(messageData);

            // Update match's lastMessageAt
            await matchRef.update({
                lastMessageAt: FieldValue.serverTimestamp(),
            });

            return {
                ...messageData,
                id: messageRef.id,
                createdAt: new Date(),
            } as Message;
        } catch (error) {
            console.error('Error in sendMessage:', error);
            await adminDb.collection('system_logs').add({
                event: 'error_send_message',
                senderId,
                matchId,
                error: (error as Error).message,
                timestamp: FieldValue.serverTimestamp()
            });
            throw error;
        }
    },

    async moderateMessage(messageId: string, text: string) {
        try {
            // This will be called by a trigger or separately
            const { filterOffensiveMessages } = await import('@/ai/flows/filter-offensive-messages');
            const moderationResult = await filterOffensiveMessages({ text });

            const status = moderationResult.isOffensive ? 'flagged' : 'approved';

            await adminDb.collection('messages').doc(messageId).update({
                text: moderationResult.filteredText,
                isFiltered: moderationResult.isOffensive,
                status: status,
                moderatedAt: FieldValue.serverTimestamp(),
                moderationCategory: moderationResult.category || 'general'
            });

            // Audit log
            await adminDb.collection('ai_logs').add({
                type: 'message_moderation',
                messageId,
                textLength: text.length,
                result: status,
                isOffensive: moderationResult.isOffensive,
                timestamp: FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error in moderateMessage:', error);
            await adminDb.collection('system_logs').add({
                event: 'error_moderate_message',
                messageId,
                error: (error as Error).message,
                timestamp: FieldValue.serverTimestamp()
            });
        }
    }
};
