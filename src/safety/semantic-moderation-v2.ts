export class SemanticModerationV2 {
    static async checkSafe(content: string, context: 'chat' | 'bio' | 'event'): Promise<{ safe: boolean; tags: string[] }> {
        const tags = [];
        let safe = true;

        // 1. Context-Aware filtering
        if (context === 'bio') {
            // Stricter on PII
            if (content.match(/\d{3}-\d{4}/)) { // Simple phone regex
                safe = false;
                tags.push('PII_DETECTED');
            }
        }

        // 2. Semantic Intent (Simulation)
        if (content.toLowerCase().includes('money') || content.toLowerCase().includes('crypto')) {
            tags.push('POTENTIAL_SCAM');
            // Flag for review but don't auto-block unless threshold met
        }

        return { safe, tags };
    }
}
