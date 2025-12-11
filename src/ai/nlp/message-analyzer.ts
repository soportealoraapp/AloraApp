import Sentiment from 'sentiment';
import { Message } from '@/lib/domain/types';

const sentiment = new Sentiment();

export interface ChatAnalysis {
    sentimentScore: number; // -10 to +10 usually
    tone: 'positive' | 'neutral' | 'negative';
    intent?: 'flirty' | 'friendly' | 'hostile' | 'unknown';
    toxicity: number; // 0-1
}

export const messageAnalyzer = {
    analyzeMessage(text: string): ChatAnalysis {
        const result = sentiment.analyze(text);
        const score = result.score;

        let tone: ChatAnalysis['tone'] = 'neutral';
        if (score > 2) tone = 'positive';
        if (score < -2) tone = 'negative';

        // Heuristics for intent (Mock NLP)
        const lower = text.toLowerCase();
        let intent: ChatAnalysis['intent'] = 'unknown';

        // Simple dictionaries
        if (lower.match(/guapo|guapa|linda|lindo|encantas|cita|cenar|beso/)) intent = 'flirty';
        else if (lower.match(/hola|tal|bien|amigo|amiga|jaja/)) intent = 'friendly';
        else if (lower.match(/odio|mal|feo|fea|estupido|idiota/)) intent = 'hostile';

        // Toxicity check (Simple bad word match)
        const toxicity = intent === 'hostile' ? 0.8 : 0.0;

        return {
            sentimentScore: score,
            tone,
            intent,
            toxicity
        };
    },

    calculateChatHealth(messages: Message[]): number {
        if (messages.length === 0) return 0;

        let totalSentiment = 0;
        messages.forEach(m => {
            const analysis = this.analyzeMessage(m.content);
            totalSentiment += analysis.sentimentScore;
        });

        const avg = totalSentiment / messages.length;
        // Normalize -5 to +5 -> 0 to 100 roughly
        let health = 50 + (avg * 10);
        return Math.min(100, Math.max(0, health));
    }
};
