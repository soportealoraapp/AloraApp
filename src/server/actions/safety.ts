"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { calculateReputationScore } from "@/lib/utils/reputation";

const VALID_CATEGORIES = [
    'spam', 'harassment', 'offensive_language', 'sexual_content',
    'impersonation', 'spam_fraud', 'minor', 'violence', 'fake_identity', 'other',
] as const;

export async function reportUser(reporterId: string, reportedId: string, reason: string, details?: string) {
    try {
        if (reporterId === reportedId) {
            return { success: false, error: "No puedes reportarte a ti mismo" };
        }

        if (!VALID_CATEGORIES.includes(reason as any)) {
            return { success: false, error: "Categoría inválida" };
        }

        await prisma.report.create({
            data: {
                reporterId,
                reportedId,
                reason,
                details,
                status: 'pending'
            }
        });

        // Sync reputation to DB
        await calculateReputationScore(reportedId);

        // Auto-escalate to watchlist if 3+ pending reports (excluding spam/other)
        if (reason !== 'spam' && reason !== 'other') {
            const reportCount = await prisma.report.count({
                where: { reportedId, status: 'pending' }
            });

            if (reportCount >= 3) {
                await prisma.profile.update({
                    where: { userId: reportedId },
                    data: { trustStatus: 'watchlist' },
                });
            }
        }

        revalidatePath('/discover');
        return { success: true };
    } catch (error) {
        console.error("Failed to report user", error);
        return { success: false, error: "Error al enviar el reporte" };
    }
}


