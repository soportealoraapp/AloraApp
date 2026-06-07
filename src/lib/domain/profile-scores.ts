export interface ProfileScores {
    completeness: number;
    reputation: number;
    activation: {
        score: number;
        level: 'low' | 'medium' | 'high';
        missingActions: string[];
    };
    trust: {
        score: number;
        level: string;
        reasons: string[];
        improvementTips: string[];
    };
    quality: {
        score: number;
        breakdown: Record<string, number>;
        recommendations: { text: string; impact: number; category: string }[];
    };
}
