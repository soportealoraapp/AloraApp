import { prisma } from '@/lib/prisma';
import { getRegionalHealth } from './engine';

export interface WaitlistResult {
    status: 'approved' | 'waitlisted' | 'already_waiting';
    position?: number;
    message: string;
}

const SATURATION_THRESHOLD = 2.5; // ratio above which waitlist activates

/**
 * Check if a user can join or is already in a waitlist for a region.
 */
export async function checkWaitlistStatus(userId: string, region: string): Promise<{
    onWaitlist: boolean;
    position: number | null;
    status: string | null;
}> {
    const entry = await prisma.waitlistEntry.findUnique({
        where: { userId_region: { userId, region } },
        select: { status: true, priority: true, createdAt: true }
    });

    if (!entry) {
        return { onWaitlist: false, position: null, status: null };
    }

    if (entry.status === 'approved') {
        return { onWaitlist: false, position: null, status: 'approved' };
    }

    // Get position
    const ahead = await prisma.waitlistEntry.count({
        where: {
            region,
            status: 'waiting',
            priority: { gt: entry.priority }
        }
    });

    return { onWaitlist: true, position: ahead + 1, status: entry.status };
}

/**
 * Add a user to the waitlist for a region.
 */
export async function joinWaitlist(userId: string, region: string): Promise<WaitlistResult> {
    // Check if already on waitlist
    const existing = await prisma.waitlistEntry.findUnique({
        where: { userId_region: { userId, region } }
    });

    if (existing) {
        if (existing.status === 'approved') {
            return { status: 'approved', message: 'Ya tienes acceso a esta región' };
        }
        return { status: 'already_waiting', message: 'Ya estás en la lista de espera' };
    }

    // Check if region is saturated
    const health = await getRegionalHealth(region);
    if (health.saturationLevel !== 'critical' && health.saturationLevel !== 'warning') {
        return { status: 'approved', message: 'La región tiene disponibilidad — no necesitas lista de espera' };
    }

    // Calculate priority
    const profile = await prisma.profile.findUnique({
        where: { userId },
        select: { gender: true, isVerified: true }
    });

    let priority = 0;
    if (profile?.gender === 'woman') priority += 100;
    if (profile?.isVerified) priority += 50;
    if (health.activeWomen < health.activeMen * 0.3) priority += 30; // Extra priority if severely imbalanced

    // Check for referral invite
    const referral = await prisma.auditLog.findFirst({
        where: { userId, action: 'REFERRAL_USED' }
    });
    if (referral) priority += 30;

    await prisma.waitlistEntry.create({
        data: { userId, region, priority }
    });

    const position = await prisma.waitlistEntry.count({
        where: { region, status: 'waiting', priority: { gt: priority } }
    });

    return {
        status: 'waitlisted',
        position: position + 1,
        message: `Estás en la lista de espera. Posición: ${position + 1}. Te notificaremos cuando haya disponibilidad.`
    };
}

/**
 * Process waitlist for a region (auto-approve when ratio improves).
 */
export async function processWaitlist(region: string): Promise<{ approved: number }> {
    const health = await getRegionalHealth(region);

    if (health.saturationLevel === 'critical') {
        return { approved: 0 };
    }

    // Get waiting entries sorted by priority
    const waiting = await prisma.waitlistEntry.findMany({
        where: { region, status: 'waiting' },
        orderBy: { priority: 'desc' },
        take: 10,
    });

    let approved = 0;
    for (const entry of waiting) {
        // Re-check ratio before each approval
        const currentHealth = await getRegionalHealth(region);
        if (currentHealth.saturationLevel === 'critical') break;

        await prisma.waitlistEntry.update({
            where: { id: entry.id },
            data: { status: 'approved', processedAt: new Date() }
        });
        approved++;
    }

    return { approved };
}
