import {
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    where,
    getDocs,
    orderBy,
    onSnapshot,
    serverTimestamp,
    Timestamp,
    limit as firestoreLimit,
} from 'firebase/firestore';
import { db } from './config';
import { Message } from './types';
import { filterOffensiveMessages } from '@/ai/flows/filter-offensive-messages';

export const chatService = {
    // Send message
    async sendMessage(
        matchId: string,
        senderId: string,
        receiverId: string,
        text: string,
        type: 'text' | 'icebreaker' = 'text'
    ): Promise<Message> {
        // Moderate message with AI
        const moderationResult = await filterOffensiveMessages({ text });

        const messageData = {
            matchId,
            senderId,
            receiverId,
            text: moderationResult.filteredText,
            isFiltered: moderationResult.isOffensive,
            type,
            createdAt: serverTimestamp(),
        };

        const messageRef = await addDoc(collection(db, 'messages'), messageData);

        // Update match's lastMessageAt
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
            lastMessageAt: serverTimestamp(),
        });

        return {
            ...messageData,
            id: messageRef.id,
            createdAt: new Date(),
        } as Message;
    },

    // Get messages for a match
    async getMessages(matchId: string, limitCount: number = 50): Promise<Message[]> {
        const messagesQuery = query(
            collection(db, 'messages'),
            where('matchId', '==', matchId),
            orderBy('createdAt', 'asc'),
            firestoreLimit(limitCount)
        );

        const snapshot = await getDocs(messagesQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            readAt: doc.data().readAt ? (doc.data().readAt as Timestamp).toDate() : undefined,
        })) as Message[];
    },

    // Mark message as read
    async markAsRead(messageId: string): Promise<void> {
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, {
            readAt: serverTimestamp(),
        });
    },

    // Mark all messages in a match as read
    async markMatchMessagesAsRead(matchId: string, userId: string): Promise<void> {
        const messagesQuery = query(
            collection(db, 'messages'),
            where('matchId', '==', matchId),
            where('receiverId', '==', userId),
            where('readAt', '==', null)
        );

        const snapshot = await getDocs(messagesQuery);
        const updatePromises = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { readAt: serverTimestamp() })
        );

        await Promise.all(updatePromises);
    },

    // Subscribe to messages in real-time
    subscribeToMessages(
        matchId: string,
        callback: (messages: Message[]) => void
    ): () => void {
        const messagesQuery = query(
            collection(db, 'messages'),
            where('matchId', '==', matchId),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(messagesQuery, snapshot => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp).toDate(),
                readAt: doc.data().readAt ? (doc.data().readAt as Timestamp).toDate() : undefined,
            })) as Message[];

            callback(messages);
        });

        return unsubscribe;
    },

    // Get unread message count for user
    async getUnreadCount(userId: string): Promise<number> {
        const messagesQuery = query(
            collection(db, 'messages'),
            where('receiverId', '==', userId),
            where('readAt', '==', null)
        );

        const snapshot = await getDocs(messagesQuery);
        return snapshot.size;
    },
};
