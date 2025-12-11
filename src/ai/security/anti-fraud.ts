export interface FraudCheckResult {
    isSuspicious: boolean;
    score: number; // 0-100 high risk
    reasons: string[];
}

export const antiFraudSystem = {
    analyzeUser(userData: any, metadata: any): FraudCheckResult {
        const reasons: string[] = [];
        let score = 0;

        // 1. Metadata Analysis
        // Check for suspicious IPs or rapid location changes (Mock)
        if (metadata?.ipReputation === 'low') {
            score += 40;
            reasons.push('IP with low reputation');
        }

        // 2. Behavioral Patterns
        // Users who swipe right 100% of time in first minute
        if (userData.swipeRightRate > 0.95 && userData.accountAgeHours < 1) {
            score += 50;
            reasons.push('Bot-like swipe behavior');
        }

        // 3. Photo Duplication (Mock hash check)
        // In real world, we'd query a vector database of photo embeddings
        if (userData.hasDuplicatePhotos) {
            score += 80;
            reasons.push('Duplicate photos detected across accounts');
        }

        return {
            isSuspicious: score > 60,
            score,
            reasons
        };
    }
};
