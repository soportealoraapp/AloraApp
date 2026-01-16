import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { UserTrustScore, Intervention } from '../types';

export const predictiveTrustServerService = {
    /**
     * Analyzes recent behavior to detect escalation of risk before reports happen.
     */
    async calculatePredictiveRisk(userId: string): Promise<{ riskTrendScore: number; interventionLevel: 0 | 1 | 2 | 3 }> {
        try {
            const trustRef = adminDb.collection('user_trust_scores').doc(userId);
            const trustDoc = await trustRef.get();
            const currentStats = trustDoc.data() as UserTrustScore;

            // v2.6: Contextual Baseline
            // let contextScores = (currentStats as any).contextScores || { dating: 100, community: 100, events: 100 };

            // Thresholds & Signals
            const now = Date.now();
            const last24h = new Date(now - 24 * 60 * 60 * 1000);

            const [recentLikes, recentPasses, recentBlocks] = await Promise.all([
                adminDb.collection('likes').where('fromUserId', '==', userId).where('createdAt', '>', last24h).get(),
                adminDb.collection('passes').where('fromUserId', '==', userId).where('createdAt', '>', last24h).get(),
                adminDb.collection('blocks').where('blockedId', '==', userId).where('createdAt', '>', last24h).get()
            ]);

            let riskPoints = 0;

            // Signal 1: Match/Like Speed (Spam detection)
            if (recentLikes.size > 100) riskPoints += 30;
            if (recentLikes.size > 200) riskPoints += 40;

            // Signal 2: Block without report correlation
            if (recentBlocks.size > 3) riskPoints += 25;

            // Signal 3: Extreme Night Activity (2 AM - 5 AM)
            const currentHour = new Date().getHours();
            if (currentHour >= 2 && currentHour <= 5) {
                if (recentLikes.size > 20) riskPoints += 15;
            }

            // Signal 4: Massive Rejections (Passes)
            if (recentPasses.size > 300) riskPoints += 20;

            // Signal 5: Trust Decay (Inactivity/Ghosting) - v2.6
            const decay = await this.calculateTrustDecay(userId);
            riskPoints += decay;

            const finalRiskScore = Math.min(100, riskPoints);

            // Determine Intervention Level
            let level: 0 | 1 | 2 | 3 = 0;
            if (finalRiskScore >= 80) level = 3;
            else if (finalRiskScore >= 50) level = 2;
            else if (finalRiskScore >= 30) level = 1;

            // Update Intervention History if level changed
            if (currentStats && currentStats.interventionLevel !== level) {
                await this.applyIntervention(userId, level, `Auto-detected risk trend: ${finalRiskScore}`);
            }

            return { riskTrendScore: finalRiskScore, interventionLevel: level };

        } catch (error) {
            console.error("Error in predictive risk calculation:", error);
            return { riskTrendScore: 0, interventionLevel: 0 };
        }
    },

    async calculateTrustDecay(userId: string): Promise<number> {
        const userSnap = await adminDb.collection('profiles').doc(userId).get();
        const profile = userSnap.data();

        if (!profile) return 0;

        const lastActiveRaw = (profile as any).lastActive;
        const lastActive = lastActiveRaw?.toDate ? lastActiveRaw.toDate() : new Date(lastActiveRaw || Date.now());
        const daysInactive = (Date.now() - lastActive.getTime()) / (1000 * 3600 * 24);

        let decayPoints = 0;
        if (daysInactive > 14) decayPoints += 10;
        if (daysInactive > 30) decayPoints += 30;

        return decayPoints;
    },

    async updateContextualScore(userId: string, domain: 'dating' | 'community' | 'events', delta: number): Promise<void> {
        const trustRef = adminDb.collection('user_trust_scores').doc(userId);
        await trustRef.update({
            [`contextScores.${domain}`]: FieldValue.increment(delta),
            lastCalculated: FieldValue.serverTimestamp()
        });
    },

    async applyIntervention(userId: string, level: 0 | 1 | 2 | 3, reason: string): Promise<void> {
        const trustRef = adminDb.collection('user_trust_scores').doc(userId);

        const typeMap: Record<number, any> = {
            1: 'delay',
            2: 'visibility_reduction',
            3: 'chat_freeze'
        };

        if (level === 0) {
            // Deactivate all active interventions
            const trustDoc = await trustRef.get();
            const history = (trustDoc.data()?.interventionHistory as Intervention[]) || [];
            const updatedHistory = history.map(i => ({ ...i, active: false, endsAt: new Date() }));

            await trustRef.update({
                interventionLevel: 0,
                interventionHistory: updatedHistory,
                lastCalculated: FieldValue.serverTimestamp()
            });
        } else {
            const newIntervention: Intervention = {
                type: typeMap[level] || 'delay',
                level,
                startedAt: new Date(),
                reason,
                active: true
            };

            await trustRef.update({
                interventionLevel: level,
                interventionHistory: FieldValue.arrayUnion(newIntervention),
                lastCalculated: FieldValue.serverTimestamp()
            });
        }

        // Log for monitoring
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: level >= 2 ? 'warn' : 'info',
            category: 'safety',
            message: `Silent Intervention Level ${level} applied to user ${userId}`,
            userId,
            details: { reason }
        });
    }
};
