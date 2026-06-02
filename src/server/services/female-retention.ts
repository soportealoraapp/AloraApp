import { prisma } from '@/lib/prisma';

export interface FemaleRetentionMetrics {
    totalFemale: number;
    activeFemaleD1: number;
    activeFemaleD7: number;
    activeFemaleD30: number;
    retentionD1: number;
    retentionD7: number;
    retentionD30: number;
    vsMale: { d1: number; d7: number; d30: number };
    topDropoffReasons: string[];
    verificationRate: number;
}

/**
 * Calculate female-specific retention metrics.
 */
export async function getFemaleRetentionMetrics(): Promise<FemaleRetentionMetrics> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneDayAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Female profiles
    const femaleProfiles = await prisma.profile.findMany({
        where: { gender: 'woman' },
        select: { userId: true, lastActiveAt: true, isVerified: true }
    });

    const totalFemale = femaleProfiles.length;
    const activeD1 = femaleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= today).length;
    const activeD7 = femaleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= oneWeekAgo).length;
    const activeD30 = femaleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= oneMonthAgo).length;

    const retentionD1 = totalFemale > 0 ? (activeD1 / totalFemale) * 100 : 0;
    const retentionD7 = totalFemale > 0 ? (activeD7 / totalFemale) * 100 : 0;
    const retentionD30 = totalFemale > 0 ? (activeD30 / totalFemale) * 100 : 0;

    // Male comparison
    const maleProfiles = await prisma.profile.findMany({
        where: { gender: 'man' },
        select: { userId: true, lastActiveAt: true }
    });

    const totalMale = maleProfiles.length;
    const maleD1 = maleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= today).length;
    const maleD7 = maleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= oneWeekAgo).length;
    const maleD30 = maleProfiles.filter(p => p.lastActiveAt && p.lastActiveAt >= oneMonthAgo).length;

    const maleRetentionD1 = totalMale > 0 ? (maleD1 / totalMale) * 100 : 0;
    const maleRetentionD7 = totalMale > 0 ? (maleD7 / totalMale) * 100 : 0;
    const maleRetentionD30 = totalMale > 0 ? (maleD30 / totalMale) * 100 : 0;

    // Verification rate
    const verified = femaleProfiles.filter(p => p.isVerified).length;
    const verificationRate = totalFemale > 0 ? (verified / totalFemale) * 100 : 0;

    // Top dropoff reasons (from reports and blocks received by women)
    const reportsAgainstWomen = await prisma.report.findMany({
        where: {
            reportedId: { in: femaleProfiles.map(p => p.userId) },
            createdAt: { gte: oneMonthAgo }
        },
        select: { reason: true }
    });

    const reasonCounts = new Map<string, number>();
    reportsAgainstWomen.forEach(r => {
        reasonCounts.set(r.reason, (reasonCounts.get(r.reason) || 0) + 1);
    });

    const topDropoffReasons = [...reasonCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([reason]) => reason);

    return {
        totalFemale,
        activeFemaleD1: activeD1,
        activeFemaleD7: activeD7,
        activeFemaleD30: activeD30,
        retentionD1: Math.round(retentionD1 * 10) / 10,
        retentionD7: Math.round(retentionD7 * 10) / 10,
        retentionD30: Math.round(retentionD30 * 10) / 10,
        vsMale: {
            d1: Math.round(maleRetentionD1 * 10) / 10,
            d7: Math.round(maleRetentionD7 * 10) / 10,
            d30: Math.round(maleRetentionD30 * 10) / 10,
        },
        topDropoffReasons,
        verificationRate: Math.round(verificationRate * 10) / 10,
    };
}
