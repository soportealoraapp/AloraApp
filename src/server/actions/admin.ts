"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAdminStats() {
    // Only for demo/dev, in production use auth check
    const [reports, lowRepProfiles, totalUsers] = await Promise.all([
        prisma.report.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { reporter: { select: { name: true, email: true } }, reported: { select: { name: true, email: true } } }
        }),
        prisma.profile.findMany({
            where: { reputationScore: { lt: 40 } },
            take: 10,
            orderBy: { reputationScore: 'asc' },
            include: { user: { select: { email: true } } }
        }),
        prisma.user.count()
    ]);

    return { reports, lowRepProfiles, totalUsers };
}

export async function toggleShadowBan(userId: string, status: boolean) {
    try {
        await prisma.profile.update({
            where: { userId },
            data: { isShadowBanned: status }
        });
        revalidatePath('/admin');
        revalidatePath('/discover');
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle shadow ban", error);
        return { success: false };
    }
}

export async function dismissReport(reportId: string) {
    try {
        await prisma.report.update({
            where: { id: reportId },
            data: { status: 'dismissed' }
        });
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error("Failed to dismiss report", error);
        return { success: false };
    }
}
