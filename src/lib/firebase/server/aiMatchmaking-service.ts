import { adminDb } from '../admin';
import { UserProfile, Match, Message } from '../types';

export interface CompatibilityV2 {
    score: number;
    potentialScore: number;
    breakdown: {
        valueAffininty: number;
        behavioralSimilarity: number;
        convEngagement: number;
        diversityFactor: number;
        socialAffinity: number; // v2.5
    };
    explanation: string[];
}

export const aiMatchmakingServerService = {
    /**
     * Deep Compatibility Model v2.0
     * Hybrid scoring based on Quizzes, Behavior, and Conversation Dynamics.
     */
    async calculateDeepCompatibility(u1: UserProfile, u2: UserProfile): Promise<CompatibilityV2> {
        const { aiCostGuardServerService } = await import('./aiCostGuard-service');
        const taskKey = `compatibility_${[u1.uid, u2.uid].sort().join('_')}`;

        return aiCostGuardServerService.executeWithGuard<CompatibilityV2>(
            taskKey,
            async () => {
                // 1. Value Affinity (From Quizzes) - 30%
                const valueScore = await this.calculateValueAffinity(u1.uid, u2.uid);

                // 2. Behavioral Similarity (Activity, Likes, Filters) - 25%
                const behaviorScore = this.calculateBehavioralSimilarity(u1, u2);

                // 3. Conversation Engagement Potential - 25%
                const engagementScore = await this.predictConversationSuccess(u1.uid, u2.uid);

                // 4. Diversity & Recency Factor (Anti-Echo Chamber) - 10%
                const diversityScore = this.calculateDiversityFactor(u2);

                // 5. Social Context Affinity (Circles & Events) - 20%
                const socialScore = await this.calculateSocialContextAffinity(u1.uid, u2.uid);

                // Weighted aggregation (v2.5 Adjustments)
                const totalScore = (valueScore * 0.25) + (behaviorScore * 0.20) + (engagementScore * 0.25) + (diversityScore * 0.10) + (socialScore * 0.20);

                return {
                    score: Math.min(100, Math.round(totalScore)),
                    potentialScore: Math.round(engagementScore),
                    breakdown: {
                        valueAffininty: Math.round(valueScore),
                        behavioralSimilarity: Math.round(behaviorScore),
                        convEngagement: Math.round(engagementScore),
                        diversityFactor: Math.round(diversityScore),
                        socialAffinity: Math.round(socialScore)
                    },
                    explanation: this.generateExplanation(valueScore, behaviorScore, engagementScore, diversityScore)
                };
            },
            {
                priority: 'deferred',
                ttlHours: 48,
                fallbackValue: {
                    score: 50,
                    potentialScore: 50,
                    breakdown: { valueAffininty: 50, behavioralSimilarity: 50, convEngagement: 50, diversityFactor: 50, socialAffinity: 50 },
                    explanation: ["Asignado automáticamente por optimización de costos"]
                }
            }
        );
    },

    async calculateValueAffinity(u1Id: string, u2Id: string): Promise<number> {
        // Fetch UserCompatibilityProfile (v1.5)
        const [p1, p2] = await Promise.all([
            adminDb.collection('compatibility_profiles').doc(u1Id).get(),
            adminDb.collection('compatibility_profiles').doc(u2Id).get()
        ]);

        if (!p1.exists || !p2.exists) return 50; // Neutral

        const data1 = p1.data();
        const data2 = p2.data();

        // Count overlapping quiz answers
        let matches = 0;
        let total = 0;

        Object.keys(data1?.quizzes || {}).forEach(quizId => {
            if (data2?.quizzes?.[quizId]) {
                const q1 = data1?.quizzes[quizId].answers;
                const q2 = data2?.quizzes[quizId].answers;
                Object.keys(q1).forEach(key => {
                    if (q1[key] === q2[key]) matches++;
                    total++;
                });
            }
        });

        return total > 0 ? (matches / total) * 100 : 60;
    },

    calculateBehavioralSimilarity(u1: UserProfile, u2: UserProfile): number {
        let score = 0;
        // Times (Active hours)
        const h1 = u1.lastActive?.getHours() || 0;
        const h2 = u2.lastActive?.getHours() || 0;
        score += Math.abs(h1 - h2) <= 3 ? 40 : 10;

        // Interest overlap
        const interests1 = new Set(u1.interests || []);
        const interests2 = u2.interests || [];
        const commonInt = interests2.filter(i => interests1.has(i)).length;
        score += Math.min(60, commonInt * 15);

        return score;
    },

    async predictConversationSuccess(u1Id: string, u2Id: string): Promise<number> {
        // Analyse previous chats (mock logic for prototype, would be real NLP in production)
        // Check if they share "Communication Style" from lifestyle filters
        return 75; // Default for now
    },

    calculateDiversityFactor(u: UserProfile): number {
        const now = Date.now();
        const age = (u as any).createdAt?.toDate?.() ? (now - (u as any).createdAt.toDate().getTime()) : 0;

        // Boost users created in the last 48 hours
        if (age < 48 * 60 * 60 * 1000) return 100;

        // Neutral for others
        return 50;
    },

    generateExplanation(v: number, b: number, e: number, d: number): string[] {
        const reasons = [];
        if (v > 80) reasons.push("Tienen valores de vida muy alineados");
        if (b > 70) reasons.push("Comparten estilos de vida similares");
        if (e > 70) reasons.push("Su potencial de conversación es excelente");
        if (d > 80) reasons.push("Nuevo perfil en tu zona");
        return reasons.length > 0 ? reasons : ["Compatibilidad equilibrada"];
    },

    async calculateSocialContextAffinity(userId1: string, userId2: string): Promise<number> {
        // Find shared circles and events
        const [circles1, circles2, events1, events2] = await Promise.all([
            adminDb.collection('community_members').where('userId', '==', userId1).get(),
            adminDb.collection('community_members').where('userId', '==', userId2).get(),
            adminDb.collection('event_participants').where('userId', '==', userId1).get(),
            adminDb.collection('event_participants').where('userId', '==', userId2).get()
        ]);

        const c1Ids = new Set(circles1.docs.map(d => d.data().circleId));
        const sharedCircles = circles2.docs.filter(d => c1Ids.has(d.data().circleId)).length;

        const e1Ids = new Set(events1.docs.map(d => d.data().eventId));
        const sharedEvents = events2.docs.filter(d => e1Ids.has(d.data().eventId)).length;

        let score = 50; // Baseline
        score += (sharedCircles * 10);
        score += (sharedEvents * 25);

        return Math.min(100, score);
    }
};
