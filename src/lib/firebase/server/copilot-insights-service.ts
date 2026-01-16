import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface EmotionalInsight {
    userId: string;
    type: 'reflection' | 'pattern' | 'coaching';
    content: string;
    clarityScoreBefore: number;
    clarityScoreAfter?: number;
    timestamp: Date;
}

export const copilotInsightsServerService = {
    async logInsightSession(userId: string, content: string, initialClarity: number): Promise<string> {
        const insightRef = adminDb.collection('profiles').doc(userId).collection('copilot_insights').doc();

        const insight: EmotionalInsight = {
            userId,
            type: 'reflection',
            content,
            clarityScoreBefore: initialClarity,
            timestamp: new Date()
        };

        await insightRef.set(insight);
        return insightRef.id;
    },

    async updateClarityScore(userId: string, insightId: string, finalClarity: number): Promise<void> {
        await adminDb.collection('profiles').doc(userId)
            .collection('copilot_insights').doc(insightId)
            .update({
                clarityScoreAfter: finalClarity
            });

        // Track Metric
        const { observabilityServerService } = await import('./observability-service');
        await (observabilityServerService as any).trackProductMetric('meaningful_interaction', finalClarity);
    }
};
