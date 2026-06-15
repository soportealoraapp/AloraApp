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


