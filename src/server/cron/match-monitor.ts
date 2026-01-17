import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';

// This runs as a scheduled function
export async function runMatchMonitor() {
    try {
        console.log("[MatchMonitor] Starting analysis...");
        const threeDaysAgo = subDays(new Date(), 3);

        // Find matches created recently (> 3 days ago, so not TOO old) 
        // that have NO messages.
        const silentMatches = await prisma.match.findMany({
            where: {
                createdAt: {
                    gte: threeDaysAgo
                },
                messages: {
                    none: {}
                }
            },
            include: {
                user1: { select: { id: true, name: true } },
                user2: { select: { id: true, name: true } }
            }
        });

        console.log(`[MatchMonitor] Found ${silentMatches.length} silent matches.`);

        for (const match of silentMatches) {
            // In a real scenario, this calls the AI Copilot to generate an icebreaker
            // and maybe sends a push notification "Need help breaking the ice?"
            console.log(`[MatchMonitor] Suggesting opener for match ${match.id} (${match.user1.name || 'User1'} & ${match.user2.name || 'User2'})`);

            // Example real logic integration:
            // await notificationService.sendPush(match.user1Id, "Break the ice!", "Ask about their travels...");
        }

        console.log("[MatchMonitor] Finished.");
    } catch (error) {
        console.error("[MatchMonitor] Error:", error);
    }
}
