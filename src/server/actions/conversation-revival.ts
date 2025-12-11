'use server';

import { adminDb } from '../firebase/admin';
import { conversationObserver } from '@/ai/chat/conversation-observer';
import { FieldValue } from 'firebase-admin/firestore';

export async function checkAndReviveConversation(chatId: string) {
    const chatDoc = await adminDb.collection('chats').doc(chatId).get();
    if (!chatDoc.exists) return;

    const data = chatDoc.data()!;
    const lastMessageDate = data.lastMessageAt?.toDate() || new Date();

    // Check Status
    const status = conversationObserver.analyzeChat(lastMessageDate, data.messageCount || 0);

    if (status.needsRevival) {
        // We don't send a push notification here directly in this ethical model
        // We flag the conversation so when the user opens the app, they see a revive suggestion
        await adminDb.collection('chats').doc(chatId).update({
            revivalSuggestionAvailable: true,
            revivalPrompt: "Ambos tenían buena compatibilidad. ¿Quieres retomar la charla?",
            lastCheck: FieldValue.serverTimestamp()
        });
    }
}
