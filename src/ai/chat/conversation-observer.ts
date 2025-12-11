import { differenceInHours } from 'date-fns';

export interface ChatHealthStatus {
    isStale: boolean;
    needsRevival: boolean;
    healthScore: number; // 0-100
    suggestion?: string;
}

export const conversationObserver = {
    analyzeChat(lastMessageDate: Date, messageCount: number): ChatHealthStatus {
        const hoursSilence = differenceInHours(new Date(), lastMessageDate);
        let healthScore = 100;

        if (hoursSilence > 6) healthScore -= 20;
        if (hoursSilence > 24) healthScore -= 40;
        if (hoursSilence > 72) healthScore -= 30; // Critical

        const isStale = hoursSilence > 6;
        const needsRevival = hoursSilence > 72;

        let suggestion;
        if (needsRevival) suggestion = "La conversación está pausada. ¿Quieres intentar un tema nuevo?";
        else if (isStale) suggestion = "El ritmo bajó un poco. Un buen momento para cambiar de tema.";

        return {
            isStale,
            needsRevival,
            healthScore: Math.max(0, healthScore),
            suggestion
        };
    }
};

export const toneMirror = {
    analyzeDraft(text: string): { suggestion?: string; tone: 'neutral' | 'warm' | 'cold' } {
        if (text.length < 5) return { suggestion: "Intenta agregar un poco más de detalle para mostrar interés.", tone: 'cold' };
        if (text.length > 200) return { suggestion: "¿Quieres resumirlo un poco para mantenerlo ligero?", tone: 'neutral' };

        // Mock sentiment check
        if (text.includes(':)') || text.includes('!')) return { tone: 'warm' };

        return { tone: 'neutral' };
    }
};
