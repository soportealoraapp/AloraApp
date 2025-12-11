'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface Story {
    id: string;
    userId: string;
    thumbnailUrl: string; // generated client side or via cloud function
    videoUrl: string;
    expiresAt: Date;
    visibility: 'public' | 'matches';
    tags?: string[];
    likes: number;
}

export async function uploadStory(data: Omit<Story, 'id' | 'likes'>) {
    const ref = adminDb.collection('stories').doc();
    // Default TTL 24h if not specified
    const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    await ref.set({
        ...data,
        expiresAt,
        likes: 0,
        createdAt: FieldValue.serverTimestamp()
    });
    return ref.id;
}

export async function getStoriesFeed(userId: string): Promise<Story[]> {
    // In a real app, query based on matches + public stories + social graph
    const snapshot = await adminDb.collection('stories')
        .where('expiresAt', '>', new Date())
        .limit(20)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
}

export async function reactToStory(interaction: { viewerId: string, storyId: string, type: 'like' | 'soft_intent' }) {
    // 1. Log interaction
    await adminDb.collection('stories').doc(interaction.storyId).collection('interactions').add({
        ...interaction,
        timestamp: FieldValue.serverTimestamp()
    });

    if (interaction.type === 'like') {
        await adminDb.collection('stories').doc(interaction.storyId).update({
            likes: FieldValue.increment(1)
        });
    }

    // 2. Soft Intent Logic (Viral): If viewer is not a match, create a 'potential_connection' record
    // but DO NOT send direct notification if privacy is strict. 
    // Just increment "Social Energy" for the owner.
}
