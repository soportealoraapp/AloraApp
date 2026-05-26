'use server';

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.MEMORY_ENCRYPTION_KEY || 'dev-encryption-key-32chars!!';

function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
    try {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return encryptedText; // fallback: return as-is if not encrypted
    }
}

export interface UserMemory {
    enabled: boolean;
    communicationPreferences: {
        preferredTone: 'warm' | 'playful' | 'direct' | 'thoughtful';
        responsePace: 'fast' | 'moderate' | 'slow';
        preferredConversationTopics: string[];
        dealbreakers: string[];
    } | null;
    emotionalPatterns: {
        overallSentiment: number;
        engagementLevel: number;
        commonTopics: string[];
        communicationStyle: string;
    } | null;
    conversationTendencies: {
        typicalMessageLength: 'short' | 'medium' | 'long';
        initiatorStyle: 'passive' | 'balanced' | 'active';
        questionFrequency: 'low' | 'medium' | 'high';
        usesHumor: boolean;
        respondsToDeepQuestions: boolean;
    } | null;
    pacingStyle: {
        speed: 'slow' | 'moderate' | 'fast';
        consistency: number;
        patience: number;
    } | null;
    relationshipIntentions: {
        lookingFor: string;
        seriousness: number;
        opennessTo: string[];
    } | null;
    lastUpdated: Date | null;
}

export interface AIContextEntry {
    key: string;
    value: string;
    category: 'preference' | 'behavior' | 'pattern' | 'intention' | 'note';
    confidence: number;
    createdAt: Date;
}

export async function getUserMemory(userId: string): Promise<UserMemory> {
    const profile = await prisma.profile.findUnique({ where: { userId } });
    if (!profile) return { enabled: false, communicationPreferences: null, emotionalPatterns: null, conversationTendencies: null, pacingStyle: null, relationshipIntentions: null, lastUpdated: null };

    // Check if memory is enabled
    const memoryPrefs = await prisma.userMemory.findUnique({ where: { userId } });
    if (!memoryPrefs || !memoryPrefs.enabled) {
        return { enabled: false, communicationPreferences: null, emotionalPatterns: null, conversationTendencies: null, pacingStyle: null, relationshipIntentions: null, lastUpdated: null };
    }

    const result: UserMemory = {
        enabled: memoryPrefs.enabled,
        communicationPreferences: memoryPrefs.communicationPrefs ? JSON.parse(memoryPrefs.communicationPrefs) : null,
        emotionalPatterns: memoryPrefs.emotionalPatterns ? JSON.parse(memoryPrefs.emotionalPatterns) : null,
        conversationTendencies: memoryPrefs.conversationTendencies ? JSON.parse(memoryPrefs.conversationTendencies) : null,
        pacingStyle: memoryPrefs.pacingStyle ? JSON.parse(memoryPrefs.pacingStyle) : null,
        relationshipIntentions: memoryPrefs.relationshipIntentions ? JSON.parse(memoryPrefs.relationshipIntentions) : null,
        lastUpdated: memoryPrefs.updatedAt,
    };

    return result;
}

export async function enableMemory(userId: string, enabled: boolean): Promise<void> {
    await prisma.userMemory.upsert({
        where: { userId },
        create: { userId, enabled },
        update: { enabled },
    });
}

export async function updateMemoryPreferences(
    userId: string,
    prefs: {
        communicationPreferences?: UserMemory['communicationPreferences'];
        relationshipIntentions?: UserMemory['relationshipIntentions'];
    },
): Promise<void> {
    const existing = await prisma.userMemory.findUnique({ where: { userId } });
    const data: any = {};

    if (prefs.communicationPreferences) {
        data.communicationPrefs = JSON.stringify(prefs.communicationPreferences);
    }
    if (prefs.relationshipIntentions) {
        data.relationshipIntentions = JSON.stringify(prefs.relationshipIntentions);
    }

    if (existing) {
        await prisma.userMemory.update({ where: { userId }, data });
    } else {
        await prisma.userMemory.create({
            data: { userId, enabled: true, ...data },
        });
    }
}

export async function learnFromConversation(userId: string, messages: { content: string; role: 'sent' | 'received' }[]): Promise<void> {
    const memory = await prisma.userMemory.findUnique({ where: { userId } });
    if (!memory || !memory.enabled) return;

    // Analyze messages to extract patterns
    const ownMessages = messages.filter(m => m.role === 'sent');
    if (ownMessages.length < 5) return; // Need enough data

    // Detect typical message length
    const avgLen = ownMessages.reduce((s, m) => s + m.content.length, 0) / ownMessages.length;
    let typicalLength: 'short' | 'medium' | 'long' = 'medium';
    if (avgLen < 30) typicalLength = 'short';
    else if (avgLen > 100) typicalLength = 'long';

    // Detect question frequency
    const questionCount = ownMessages.filter(m => m.content.includes('?')).length;
    const questionFreq = questionCount / ownMessages.length;
    let questionFrequency: 'low' | 'medium' | 'high' = 'medium';
    if (questionFreq < 0.15) questionFrequency = 'low';
    else if (questionFreq > 0.4) questionFrequency = 'high';

    // Detect humor usage
    const humorIndicators = ['jaja', 'jeje', '😂', '😅', '😄', 'lol', 'xd', 'broma', 'gracioso'];
    const usesHumor = ownMessages.some(m => humorIndicators.some(h => m.content.toLowerCase().includes(h)));

    // Detect if they respond to deep questions
    const deepIndicators = ['siento', 'pienso', 'creo', 'emociona', 'importa', 'valoro'];
    const respondsDeep = ownMessages.some(m => deepIndicators.some(d => m.content.toLowerCase().includes(d)));

    // Detect overall sentiment from messages
    const positiveWords = ['feliz', 'contento', 'alegre', 'genial', 'excelente', 'bueno', 'bonito', 'lindo', 'encanta', 'gusta', 'amo'];
    const negativeWords = ['triste', 'mal', 'feo', 'horrible', 'terrible', 'cansado', 'estresado', 'preocupado'];
    const posCount = ownMessages.filter(m => positiveWords.some(w => m.content.toLowerCase().includes(w))).length;
    const negCount = ownMessages.filter(m => negativeWords.some(w => m.content.toLowerCase().includes(w))).length;
    const overallSentiment = posCount > 0 || negCount > 0
        ? Math.round((posCount / Math.max(1, posCount + negCount)) * 100)
        : 50;

    // Common topics
    const topicPatterns: { words: string[]; topic: string }[] = [
        { words: ['viaje', 'viajar', 'vuelo', 'destino', 'hotel'], topic: 'viajes' },
        { words: ['música', 'canción', 'banda', 'concierto', 'playlist'], topic: 'música' },
        { words: ['película', 'serie', 'cine', 'netflix', 'documental'], topic: 'cine/series' },
        { words: ['libro', 'leer', 'lectura', 'autor', 'biblioteca'], topic: 'lectura' },
        { words: ['deporte', 'gym', 'ejercicio', 'correr', 'yoga'], topic: 'deporte' },
        { words: ['cocina', 'cocinar', 'comida', 'receta', 'restaurante'], topic: 'gastronomía' },
        { words: ['familia', 'amigos', 'hermano', 'mamá', 'papá'], topic: 'familia/amistades' },
        { words: ['trabajo', 'carrera', 'oficina', 'profesión', 'estudio'], topic: 'carrera' },
    ];

    const topicCounts = topicPatterns.map(tp => ({
        topic: tp.topic,
        count: ownMessages.filter(m => tp.words.some(w => m.content.toLowerCase().includes(w))).length,
    }));
    topicCounts.sort((a, b) => b.count - a.count);
    const commonTopics = topicCounts.filter(t => t.count > 0).slice(0, 5).map(t => t.topic);

    // Detect communication style
    const directCount = ownMessages.filter(m => m.content.length < 50 && !m.content.includes('?')).length;
    const thoughtfulCount = ownMessages.filter(m => m.content.length > 100 || deepIndicators.some(d => m.content.toLowerCase().includes(d))).length;
    const playfulCount = ownMessages.filter(m => m.content.includes('😂') || m.content.includes('jaja') || m.content.includes('jeje')).length;

    let commStyle = 'balanced';
    if (thoughtfulCount > directCount && thoughtfulCount > playfulCount) commStyle = 'thoughtful';
    else if (playfulCount > directCount && playfulCount > thoughtfulCount) commStyle = 'playful';
    else if (directCount > thoughtfulCount && directCount > playfulCount) commStyle = 'direct';

    // Detect initiative style
    const conversations = await prisma.message.findMany({
        where: { senderId: userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: { matchId: true, createdAt: true },
    });

    const uniqueMatches = new Set(conversations.map(m => m.matchId)).size;
    const messagesPerConversation = conversations.length / Math.max(1, uniqueMatches);
    const initiatorStyle = messagesPerConversation > 10 ? 'active' : messagesPerConversation > 4 ? 'balanced' : 'passive';

    // Save learned patterns
    const conversationTendencies = {
        typicalMessageLength: typicalLength,
        initiatorStyle,
        questionFrequency,
        usesHumor,
        respondsToDeepQuestions: respondsDeep,
    };

    const emotionalPatterns = {
        overallSentiment,
        engagementLevel: Math.min(100, Math.round((ownMessages.length / 50) * 100)),
        commonTopics,
        communicationStyle: commStyle,
    };

    await prisma.userMemory.update({
        where: { userId },
        data: {
            conversationTendencies: JSON.stringify(conversationTendencies),
            emotionalPatterns: JSON.stringify(emotionalPatterns),
        },
    });
}

export async function deleteMemory(userId: string): Promise<void> {
    await prisma.userMemory.delete({ where: { userId } }).catch(() => {});
}

export async function getAIContext(userId: string): Promise<AIContextEntry[]> {
    const memory = await getUserMemory(userId);
    if (!memory.enabled) return [];

    const entries: AIContextEntry[] = [];

    if (memory.communicationPreferences) {
        entries.push({ key: 'preferred_tone', value: memory.communicationPreferences.preferredTone, category: 'preference', confidence: 0.7, createdAt: new Date() });
        entries.push({ key: 'response_pace', value: memory.communicationPreferences.responsePace, category: 'preference', confidence: 0.6, createdAt: new Date() });
        if (memory.communicationPreferences.preferredConversationTopics.length > 0) {
            entries.push({ key: 'preferred_topics', value: memory.communicationPreferences.preferredConversationTopics.join(', '), category: 'preference', confidence: 0.7, createdAt: new Date() });
        }
    }

    if (memory.emotionalPatterns) {
        entries.push({ key: 'overall_sentiment', value: String(memory.emotionalPatterns.overallSentiment), category: 'behavior', confidence: 0.5, createdAt: new Date() });
        entries.push({ key: 'communication_style', value: memory.emotionalPatterns.communicationStyle, category: 'pattern', confidence: 0.6, createdAt: new Date() });
    }

    if (memory.conversationTendencies) {
        entries.push({ key: 'message_length', value: memory.conversationTendencies.typicalMessageLength, category: 'pattern', confidence: 0.7, createdAt: new Date() });
        entries.push({ key: 'initiator_style', value: memory.conversationTendencies.initiatorStyle, category: 'pattern', confidence: 0.6, createdAt: new Date() });
    }

    return entries;
}
