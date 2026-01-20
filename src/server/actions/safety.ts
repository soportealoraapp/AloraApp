"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateReputationScore } from "@/lib/utils/reputation";

export async function reportUser(reporterId: string, reportedId: string, reason: string, details?: string) {
    try {
        await prisma.report.create({
            data: {
                reporterId,
                reportedId,
                reason,
                details,
                status: 'pending'
            }
        });

        // v3.9.1: Sync rep to DB immediately
        await calculateReputationScore(reportedId);

        revalidatePath('/discover');
        return { success: true };
    } catch (error) {
        console.error("Failed to report user", error);
        return { success: false, error: "Error al enviar el reporte" };
    }
}

export async function blockUser(blockerId: string, blockedId: string, reason?: string) {
    try {
        await prisma.block.create({
            data: {
                blockerId,
                blockedId,
                reason
            }
        });

        // Deactivate matches...
        const [u1, u2] = [blockerId, blockedId].sort();
        // ... (existing updateMany logic)
        await prisma.match.updateMany({
            where: {
                user1Id: u1,
                user2Id: u2,
                isActive: true
            },
            data: {
                isActive: false,
                stage: 'unmatched',
                deletedAt: new Date()
            }
        });

        // v3.9.1: Sync rep to DB immediately
        await calculateReputationScore(blockedId);

        revalidatePath('/discover');
        revalidatePath('/chat');
        return { success: true };
    } catch (error) {
        console.error("Failed to block user", error);
        return { success: false, error: "Error al bloquear usuario" };
    }
}
