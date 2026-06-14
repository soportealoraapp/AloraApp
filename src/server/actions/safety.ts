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
        await prisma.block.upsert({
            where: {
                blockerId_blockedId: {
                    blockerId,
                    blockedId,
                }
            },
            update: { reason: reason || null },
            create: {
                blockerId,
                blockedId,
                reason: reason || null,
            }
        });

        // Deactivate any active match between them (bidirectional)
        await prisma.match.updateMany({
            where: {
                OR: [
                    { user1Id: blockerId, user2Id: blockedId, isActive: true },
                    { user1Id: blockedId, user2Id: blockerId, isActive: true },
                ]
            },
            data: {
                isActive: false,
                stage: 'unmatched',
                deletedAt: new Date()
            }
        });

        revalidatePath('/discover');
        revalidatePath('/chat');
        revalidatePath('/settings/privacy/blocked');
        return { success: true };
    } catch (error) {
        console.error("Failed to block user", error);
        return { success: false, error: "Error al bloquear usuario" };
    }
}
