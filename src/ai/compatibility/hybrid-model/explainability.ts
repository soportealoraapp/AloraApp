import { ScoreResult } from './scorer';

export const explainability = {
    explainScore: (result: ScoreResult): string[] => {
        // Sort breakdown by absolute impact to show most significant factors
        const sortedFactors = Object.entries(result.breakdown)
            .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));

        const reasons: string[] = [];

        sortedFactors.slice(0, 3).forEach(([key, value]) => {
            if (value > 0) reasons.push(`✅ ${key} aporta positivamente (+${value.toFixed(0)})`);
            else reasons.push(`⚠️ ${key} reduce compatibilidad (${value.toFixed(0)})`);
        });

        if (result.totalScore > 85) reasons.unshift("✨ Alta compatibilidad detectada!");

        return reasons;
    }
};
