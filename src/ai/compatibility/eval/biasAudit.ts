export const biasAudit = {
    runAudit: (scoredPairs: any[]) => {
        // Evaluate average score by gender config
        const stats: Record<string, { sum: number, count: number }> = {};

        scoredPairs.forEach(pair => {
            const key = pair.genderPairType || 'unknown'; // e.g., 'F-M', 'M-M'
            if (!stats[key]) stats[key] = { sum: 0, count: 0 };
            stats[key].sum += pair.score;
            stats[key].count++;
        });

        const report = Object.entries(stats).map(([k, v]) => ({
            group: k,
            avgScore: v.sum / v.count
        }));

        console.table(report);
        return report;
    }
};
