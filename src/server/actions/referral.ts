'use server';

import { adminDb } from '../firebase/admin';
import { socialEnergyAI } from '@/ai/social/social-energy';

export async function generateReferralLink(userId: string): Promise<string | null> {
    const energy = await socialEnergyAI.calculateSocialEnergy(userId);

    // Gatekeeping: Only if energy > 70
    if (energy < 70) return null;

    // Create unique code
    const code = `ALORA-${userId.substring(0, 4).toUpperCase()}-${Date.now().toString().substring(8)}`;

    await adminDb.collection('referrals').add({
        userId,
        code,
        createdAt: new Date(),
        uses: 0
    });

    return `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${code}`;
}
