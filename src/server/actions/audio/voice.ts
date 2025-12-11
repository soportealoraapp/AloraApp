'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { transcriptionService } from '@/audio/transcription/transcribe';
import { voiceEmotionEngine } from '@/audio/emotion/detectEmotion';

export type VoiceMessageMetadata = {
    userId: string;
    matchId: string;
    duration: number;
    url: string;
    expiresAt?: Date;
    transcript?: string;
    emotion?: any;
    consented: boolean;
};

export async function uploadVoiceMessage(data: VoiceMessageMetadata) {
    if (!data.consented) throw new Error("Consent required for voice messages.");

    // 1. Simulate Upload (We assume 'url' is provided by client after direct storage upload in a real app)
    // Here we treat it as valid.

    // 2. Process AI (Opt-in usually, assuming true for demo flow)
    const transaction = await transcriptionService.transcribeAudio(data.url);
    const emotion = voiceEmotionEngine.detectEmotion({ duration: data.duration });

    // 3. Save to DB
    const ref = adminDb.collection('voice_messages').doc();
    await ref.set({
        ...data,
        transcript: transaction.text,
        emotion,
        createdAt: FieldValue.serverTimestamp(),
        isModerated: false
    });

    return { id: ref.id, transcript: transaction.text, emotion };
}

export async function deleteVoiceMessage(messageId: string, userId: string) {
    const ref = adminDb.collection('voice_messages').doc(messageId);
    const doc = await ref.get();

    if (!doc.exists) throw new Error("Not found");
    if (doc.data()?.userId !== userId) throw new Error("Unauthorized");

    await ref.delete();
    // In real app, also trigger Storage delete
}
