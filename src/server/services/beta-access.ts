import { prisma } from '@/lib/prisma';

export interface BetaAccessResult {
    success: boolean;
    message: string;
    code?: string;
}

/**
 * Generate a beta invitation code.
 */
export async function generateBetaCode(
    createdBy: string,
    region?: string,
    maxUses: number = 1,
    expiresDays: number = 30
): Promise<BetaAccessResult> {
    const code = `ALORA-BETA-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await prisma.betaCode.create({
        data: {
            code,
            createdBy,
            maxUses,
            region: region || null,
            expiresAt: new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000),
        }
    });

    return { success: true, message: `Código generado: ${code}`, code };
}

/**
 * Validate and use a beta code.
 */
export async function useBetaCode(code: string, userId: string, userRegion?: string): Promise<BetaAccessResult> {
    const betaCode = await prisma.betaCode.findUnique({
        where: { code }
    });

    if (!betaCode) {
        return { success: false, message: 'Código no válido' };
    }

    if (!betaCode.active) {
        return { success: false, message: 'Código desactivado' };
    }

    if (betaCode.expiresAt && betaCode.expiresAt < new Date()) {
        return { success: false, message: 'Código expirado' };
    }

    if (betaCode.usedCount >= betaCode.maxUses) {
        return { success: false, message: 'Código agotado' };
    }

    // Check regional restriction
    if (betaCode.region && userRegion && betaCode.region !== userRegion) {
        return { success: false, message: 'Código no disponible en tu región' };
    }

    // Use the code
    await prisma.betaCode.update({
        where: { id: betaCode.id },
        data: { usedCount: { increment: 1 } }
    });

    // Mark user as beta
    await prisma.user.update({
        where: { id: userId },
        data: {
            isBetaUser: true,
            betaInvitedBy: betaCode.createdBy,
        }
    });

    return { success: true, message: '¡Bienvenido a la beta cerrada!' };
}

/**
 * Check if a user has beta access.
 */
export async function hasBetaAccess(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { isBetaUser: true, role: true }
    });

    // Admins always have access
    if (user?.role === 'admin' || user?.role === 'moderator') return true;

    return user?.isBetaUser ?? false;
}

/**
 * Get beta codes created by a user.
 */
export async function getUserBetaCodes(userId: string) {
    return prisma.betaCode.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: 'desc' },
        select: {
            code: true, maxUses: true, usedCount: true,
            region: true, active: true, expiresAt: true, createdAt: true,
        }
    });
}

/**
 * Get beta access stats.
 */
export async function getBetaStats() {
    const [totalCodes, activeCodes, totalBetaUsers, recentSignups] = await Promise.all([
        prisma.betaCode.count(),
        prisma.betaCode.count({ where: { active: true } }),
        prisma.user.count({ where: { isBetaUser: true } }),
        prisma.user.count({
            where: {
                isBetaUser: true,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        }),
    ]);

    return { totalCodes, activeCodes, totalBetaUsers, recentSignups };
}
