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
        // Basic coaching logic
        if (userIntent.includes('ansiedad')) {
            return "Es normal sentir nervios. Respira profundo. Recuerda que tú también estás evaluando si esa persona encaja contigo.";
        }

        return "Cuéntame más sobre cómo te sientes antes de enviar ese mensaje.";
    },

    async detectPatterns(userId: string): Promise<string[]> {
        const patterns: string[] = [];
        // Mock analysis of recent active sessions
        patterns.push("Tendencia a la sobre-inversión inicial.");
        return patterns;
    }
};
