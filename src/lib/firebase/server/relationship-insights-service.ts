import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface RelationalPattern {
    type: 'conflict_avoidance' | 'over_accommodation' | 'distance_cycle' | 'repair_delay';
    frequency: number;
    lastDetected: Date;
    softInsight: string;
}

export const relationshipInsightsServerService = {
    async analyzeRelationalPatterns(userId: string): Promise<RelationalPattern[]> {
        // Mock analysis of relationship notes and conflict history
        const patterns: RelationalPattern[] = [
            {
                type: 'conflict_avoidance',
                frequency: 3,
                lastDetected: new Date(),
                softInsight: "He notado que algunos temas importantes se posponen para evitar tensiones. Hablar de ellos con calma puede prevenir explosiones futuras."
            }
        ];

        return patterns;
    },

    async trackRelationalHealth(userId: string, metrics: { conflictClarity: number; emotionalAgency: number }): Promise<void> {
        const trendRef = adminDb.collection('profiles').doc(userId).collection('relationship_trends').doc();

        await trendRef.set({
            ...metrics,
            timestamp: FieldValue.serverTimestamp()
        });

        // Track as product metrics
        const { observabilityServerService } = await import('./observability-service');
        await (observabilityServerService as any).trackProductMetric('meaningful_interaction', metrics.conflictClarity, { type: 'relational_health' });
    }
};
