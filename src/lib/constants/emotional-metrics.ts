export const EMOTIONAL_METRICS = {
    /**
     * Reply Confidence Rate:
     * Estimates how likely a user feels comfortable replying based on conversation signals.
     */
    calculateReplyConfidence: (messageHistory: any[]): number => {
        if (!messageHistory || messageHistory.length === 0) return 0.5;

        let score = 0.5;

        // Factor 1: Average message length (longer = more invested = higher confidence)
        const avgLength = messageHistory.reduce((sum, m) => sum + (m.content?.length || 0), 0) / messageHistory.length;
        if (avgLength > 50) score += 0.1;
        if (avgLength > 100) score += 0.1;

        // Factor 2: Question marks indicate engagement and invite replies
        const questionCount = messageHistory.reduce((count, m) => {
            return count + ((m.content?.match(/\?/g) || []).length);
        }, 0);
        const questionsPerMsg = questionCount / messageHistory.length;
        if (questionsPerMsg > 0.3) score += 0.1;
        if (questionsPerMsg > 0.6) score += 0.05;

        // Factor 3: Conversation length (more messages = established rapport)
        if (messageHistory.length > 5) score += 0.05;
        if (messageHistory.length > 15) score += 0.05;

        // Factor 4: Recency — penalize if last message was very long ago (stale convo)
        const lastMsg = messageHistory[messageHistory.length - 1];
        if (lastMsg?.createdAt) {
            const hoursSinceLast = (Date.now() - new Date(lastMsg.createdAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLast > 24) score -= 0.15;
            if (hoursSinceLast > 72) score -= 0.2;
        }

        // Factor 5: Emoji usage signals positive affect
        const emojiCount = messageHistory.reduce((count, m) => {
            return count + ((m.content?.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length);
        }, 0);
        if (emojiCount > 3) score += 0.05;

        return Math.max(0, Math.min(1, parseFloat(score.toFixed(2))));
    },

    /**
     * User Calm Score:
     * Derived from scroll speed and tap frequency.
     * Higher score = more relaxed/meaningful interaction.
     */
    userCalmScore: {
        baseline: 75,
        penalties: {
            rapidSwipe: 5,
            rapidChatOpen: 2
        }
    },

    /**
     * Conversation Continuity:
     * Measures if conversations flow naturally or feel forced.
     */
    conversationContinuity: "Reflejada en el tiempo medio entre turnos y el uso de prompts contextuales."
};
