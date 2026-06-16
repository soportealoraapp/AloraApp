import { prisma } from '@/lib/prisma';

export interface SafetyStatus {
    overallProtection: 'high' | 'medium' | 'low';
    verificationStatus: string;
    blockedCount: number;
    reportsMade: number;
    blockedUsers: Array<{ id: string; displayName: string; photos: string[] }>;
    reports: Array<{ id: string; reason: string; status: string; createdAt: string }>;
    privacySettings: {
        incognito: boolean;
        showMeInDiscover: boolean;
        verifiedOnlyFilter: boolean;
    };
    recommendations: string[];
}

/**
 * Get comprehensive safety status for a user.
 */
export async function getSafetyStatus(userId: string): Promise<SafetyStatus> {
    const [profile, blockedCount, reportsMade, verificationSub, blockedProfiles, reportsList] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: {
                isVerified: true, incognitoMode: true, showMeInDiscover: true,
                trustStatus: true,
            }
        }),
        prisma.block.count({ where: { blockerId: userId } }),
        prisma.report.count({ where: { reporterId: userId } }),
        prisma.verificationSubmission.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: { status: true }
        }),
        prisma.block.findMany({
            where: { blockerId: userId },
            include: { blocked: { select: { id: true, profile: { select: { displayName: true, photos: true } } } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.report.findMany({
            where: { reporterId: userId },
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    const blockedUsers = blockedProfiles.map(b => ({
        id: b.blocked.id,
        displayName: b.blocked.profile?.displayName || '',
        photos: b.blocked.profile?.photos || [],
    }));

    const reports = reportsList.map(r => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
    }));

    const recommendations: string[] = [];

    if (!profile?.isVerified) {
        recommendations.push('Verifica tu identidad para mayor confianza');
    }
    if (!profile?.incognitoMode) {
        recommendations.push('Activa el modo incógnito para controlar tu visibilidad');
    }

    const activeMeasures = [
        profile?.isVerified,
        profile?.incognitoMode,
        blockedCount > 0,
        reportsMade > 0,
    ].filter(Boolean).length;

    let overallProtection: SafetyStatus['overallProtection'];
    if (activeMeasures >= 3) overallProtection = 'high';
    else if (activeMeasures >= 1) overallProtection = 'medium';
    else overallProtection = 'low';

    if (overallProtection === 'low') {
        recommendations.push('Considera activar más medidas de protección');
    }

    return {
        overallProtection,
        verificationStatus: profile?.isVerified ? 'Verificado' : verificationSub?.status || 'Sin verificar',
        blockedCount,
        reportsMade,
        blockedUsers,
        reports,
        privacySettings: {
            incognito: profile?.incognitoMode || false,
            showMeInDiscover: profile?.showMeInDiscover ?? true,
            verifiedOnlyFilter: false,
        },
        recommendations,
    };
}
