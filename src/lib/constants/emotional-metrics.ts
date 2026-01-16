export const EMOTIONAL_METRICS = {
    /**
     * Reply Confidence Rate:
     * Probability that a user feels comfortable replying based on tone and time.
     */
    calculateReplyConfidence: (messageHistory: any[]) => {
        // Logic to measure "psychological safety" in the chat
        return 0.85; // Placeholder
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
