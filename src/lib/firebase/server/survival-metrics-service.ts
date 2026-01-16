import { adminDb } from '../admin';

export interface SurvivalSnapshot {
    realConnectionRate: number; // Matches that lead to > 5 messages
    ghostTownScore: number; // Percentage of inactive circles in 48h
    eventAttendanceHealth: number; // RSVP vs actual check-in ratio
    timestamp: Date;
}

export const survivalMetricsServerService = {
    async trackSurvivalPulse(cityId: string): Promise<SurvivalSnapshot> {
        // 1. Calculate Real Connection Rate (Last 7 days)
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const matchesSnap = await adminDb.collection('matches')
            .where('createdAt', '>', last7Days)
            .get();

        let meaningfulMatches = 0;
        const totalMatches = matchesSnap.size;

        if (totalMatches > 0) {
            // Sample some matches and check message counts
            // (Mock logic: in production use a summary table)
            meaningfulMatches = Math.round(totalMatches * 0.4);
        }

        // 2. Ghost Town Signal
        const circlesSnap = await adminDb.collection('communities').get();
        const totalCircles = circlesSnap.size;

        // Count circles with 0 posts in 48h
        let inactiveCircles = 0;
        // ... loop logic

        const snapshot: SurvivalSnapshot = {
            realConnectionRate: totalMatches > 0 ? (meaningfulMatches / totalMatches) * 100 : 0,
            ghostTownScore: 15, // Baseline mock
            eventAttendanceHealth: 85, // Baseline mock
            timestamp: new Date()
        };

        // If Red Flags are detected, log as critical
        if (snapshot.realConnectionRate < 20 || snapshot.ghostTownScore > 40) {
            const { monitoringServerService } = await import('./monitoring-service');
            await monitoringServerService.log({
                level: 'critical',
                category: 'system',
                message: `FAILURE SIGNAL DETECTED in ${cityId}`,
                details: snapshot
            });
        }

        return snapshot;
    }
};
