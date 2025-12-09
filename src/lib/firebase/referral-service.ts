import {
    collection,
    doc,
    setDoc,
    getDoc,
    query,
    where,
    getDocs,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Referral } from './types';

function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'ALORA-';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export const referralService = {
    // Create referral code for user
    async createReferralCode(userId: string): Promise<string> {
        const code = generateReferralCode();
        const referralRef = doc(collection(db, 'referrals'));

        await setDoc(referralRef, {
            id: referralRef.id,
            referrerId: userId,
            code,
            status: 'unused' as const,
            createdAt: serverTimestamp(),
        });

        return code;
    },

    // Get user's referral code
    async getUserReferralCode(userId: string): Promise<string | null> {
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', userId),
            where('status', '==', 'unused')
        );

        const snapshot = await getDocs(referralsQuery);
        if (snapshot.empty) {
            // Create one if doesn't exist
            return await this.createReferralCode(userId);
        }

        return snapshot.docs[0].data().code;
    },

    // Validate and use referral code
    async useReferralCode(code: string, newUserId: string): Promise<boolean> {
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('code', '==', code),
            where('status', '==', 'unused')
        );

        const snapshot = await getDocs(referralsQuery);
        if (snapshot.empty) {
            return false;
        }

        const referralDoc = snapshot.docs[0];
        const referralRef = doc(db, 'referrals', referralDoc.id);

        await updateDoc(referralRef, {
            status: 'used',
            referredId: newUserId,
            usedAt: serverTimestamp(),
        });

        return true;
    },

    // Get referral count for user
    async getReferralCount(userId: string): Promise<number> {
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', userId),
            where('status', '==', 'used')
        );

        const snapshot = await getDocs(referralsQuery);
        return snapshot.size;
    },

    // Get user's referrals
    async getUserReferrals(userId: string): Promise<Referral[]> {
        const referralsQuery = query(
            collection(db, 'referrals'),
            where('referrerId', '==', userId)
        );

        const snapshot = await getDocs(referralsQuery);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            createdAt: (doc.data().createdAt as Timestamp).toDate(),
            usedAt: doc.data().usedAt ? (doc.data().usedAt as Timestamp).toDate() : undefined,
        })) as Referral[];
    },
};
