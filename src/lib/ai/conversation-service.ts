import { prisma } from "@/lib/prisma";

export interface AiMessageParams {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: any;
}

export const aiConversationService = {
    /**
     * Get or create a general coaching session for the user.
     * For v3.x simplicity, we maintain one active session per user or create new ones daily?
     * Let's stick to a single ongoing "Coach" thread for now, or create new based on context.
     */
    getOrCreateSession: async (userId: string) => {
        // Find the most recent session
        let session = await prisma.aiCoachSession.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
            orderBy: { updatedAt: 'desc' },
            // Removed eager fetching of messages here for performance. Use getHistory for messages.
        });

        if (!session) {
            session = await prisma.aiCoachSession.create({
                data: { userId },
                include: { messages: true }
            });
        }

        return session;
    },

    addMessage: async (sessionId: string, message: AiMessageParams) => {
        return await prisma.aiMessage.create({
            data: {
                sessionId,
                role: message.role,
                content: message.content,
                metadata: message.metadata
            }
        });
    },

    async getHistory(userId: string, options: { limit?: number; offset?: number } = {}) {
        const { limit = 50, offset = 0 } = options;
        const session = await aiConversationService.getOrCreateSession(userId);

        // Optimized query: In real implementation, this would query messages table directly with skip/take
        // For now, efficient slice on the relation helper
        const messages = await prisma.aiMessage.findMany({
            where: { sessionId: session.id },
            orderBy: { createdAt: 'desc' }, // Latest first for pagination usually, or asc for chat?
            // Chat UI usually needs "latest N", so desc, then reverse
            take: limit,
            skip: offset,
        });

        // Return chronological order for UI
        return messages.reverse();
    },

    /**
     * Sync stub for potential offline capability (PWA)
     * In a real app, this would accept a client-side sync package.
     */
    syncValues: async (userId: string, localMessages: AiMessageParams[]) => {
        // Implementation depends on conflict resolution strategy
        // For now, assume server is truth for history
        return aiConversationService.getHistory(userId);
    }
};
