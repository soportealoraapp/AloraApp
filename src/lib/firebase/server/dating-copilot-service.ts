import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface CopilotSession {
    userId: string;
    lastSummary?: string;
    emotionalPatterns?: string[];
    updatedAt: Date;
}

export interface MessageReflection {
    tone: 'aggressive' | 'sarcastic' | 'anxious' | 'avoidant' | 'secure' | 'neutral';
    potentialMisunderstandings: string[];
    attachmentSignal: 'anxious' | 'avoidant' | 'secure';
    suggestedAlternative?: string;
}

export const datingCopilotServerService = {
    async analyzeMessageDraft(userId: string, text: string): Promise<MessageReflection | { error: string }> {
        // 1. Safety Filter (Anti-Manipulation)
        if (text.toLowerCase().includes('manipular') || text.toLowerCase().includes('engañar')) {
            return { error: "Como tu Copilot, solo puedo ayudarte a comunicarte de forma honesta y saludable." };
        }

        // 2. Tonal & Attachment Analysis (Mock logic for brevity)
        let tone: MessageReflection['tone'] = 'neutral';
        let signal: MessageReflection['attachmentSignal'] = 'secure';
        const misunderstandings: string[] = [];

        if (text.length > 500) misunderstandings.push("El mensaje es muy largo, podría abrumar a la otra persona.");
        if (text.includes('?')) tone = 'neutral';

        // Simple signals detection
        if (text.toLowerCase().includes('¿por qué no respondes?')) {
            tone = 'anxious';
            signal = 'anxious';
        }

        return {
            tone,
            attachmentSignal: signal,
            potentialMisunderstandings: misunderstandings,
            suggestedAlternative: tone === 'anxious' ? "Me gustaría saber de ti cuando tengas un momento." : undefined
        };
    },

    async getCoachAdvice(userId: string, userIntent: string): Promise<string> {
        // 1. Crisis Filter (P0 Safety)
        const crisisKeywords = ['suicidio', 'morir', 'matar', 'hacer daño', 'acabar con todo'];
        if (crisisKeywords.some(kw => userIntent.toLowerCase().includes(kw))) {
            const { monitoringServerService } = await import('./monitoring-service');
            await monitoringServerService.log({
                level: 'critical',
                category: 'safety',
                message: `CRISIS DETECTED: User ${userId} mentioned self-harm.`,
                userId
            });
            return "Parece que estás pasando por un momento muy difícil. Por favor, recuerda que no estás solo. Puedes contactar con profesionales en [Línea de Ayuda Local]. Yo soy una IA de acompañamiento, no puedo sustituir la ayuda profesional necesaria en estos casos.";
        }

        // 2. Prompt Injection / Jailbreak Filter (P1-FIX: normalize unicode)
        const normalizedIntent = userIntent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const jailbreakTriggers = ['system prompt', 'ignora las reglas', 'developer mode', 'hazte pasar por', 'olvida tus instrucciones', 'act as', 'ignore previous'];
        if (jailbreakTriggers.some(kw => normalizedIntent.includes(kw))) {
            return "Lo siento, como tu Copilot solo puedo hablar sobre bienestar emocional y relaciones.";
        }

        // 3. Basic coaching logic
        if (userIntent.includes('ansiedad')) {
            return "Es normal sentir nervios. Respira profundo. Recuerda que tú también estás evaluando si esa persona encaja contigo.";
        }

        return "Cuéntame más sobre cómo te sientes antes de enviar ese mensaje.";
    },

    async clearEphemeralContext(userId: string): Promise<void> {
        // P0-FIX: Actually delete ephemeral AI context data
        const contextRef = adminDb.collection('profiles').doc(userId).collection('copilot_context');
        const batch = adminDb.batch();
        const docs = await contextRef.get();
        docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
    },

    async detectPatterns(userId: string): Promise<string[]> {
        const patterns: string[] = [];
        // Mock analysis of recent active sessions
        patterns.push("Tendencia a la sobre-inversión inicial.");
        return patterns;
    }
};
