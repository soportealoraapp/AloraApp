import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
    Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { VerificationRequest } from './types';

export const verificationService = {
    // Submit verification request
    async submitVerification(userId: string, selfieUrl: string): Promise<string> {
        const verificationData = {
            userId,
            selfieUrl,
            status: 'pending' as const,
            createdAt: serverTimestamp(),
        };

        const verificationRef = await addDoc(collection(db, 'verificationRequests'), verificationData);
        return verificationRef.id;
    },

    // Get verification request
    async getVerificationRequest(userId: string): Promise<VerificationRequest | null> {
        // Note: In a real app, you'd query by userId
        // For simplicity, assuming one request per user
        const verificationRef = doc(db, 'verificationRequests', userId);
        const verificationSnap = await getDoc(verificationRef);

        if (verificationSnap.exists()) {
            const data = verificationSnap.data();
            return {
                ...data,
                id: verificationSnap.id,
                createdAt: (data.createdAt as Timestamp).toDate(),
                reviewedAt: data.reviewedAt ? (data.reviewedAt as Timestamp).toDate() : undefined,
            } as VerificationRequest;
        }

        return null;
    },

    // Approve verification (admin function)
    async approveVerification(requestId: string, reviewerId: string): Promise<void> {
        const verificationRef = doc(db, 'verificationRequests', requestId);
        const verificationSnap = await getDoc(verificationRef);

        if (!verificationSnap.exists()) {
            throw new Error('Verification request not found');
        }

        const userId = verificationSnap.data().userId;

        // Update verification request
        await updateDoc(verificationRef, {
            status: 'approved',
            reviewedAt: serverTimestamp(),
            reviewedBy: reviewerId,
        });

        // Update user profile
        const profileRef = doc(db, 'profiles', userId);
        await updateDoc(profileRef, {
            isVerified: true,
            verificationStatus: 'verified',
        });
    },

    // Reject verification (admin function)
    async rejectVerification(
        requestId: string,
        reviewerId: string,
        reason: string
    ): Promise<void> {
        const verificationRef = doc(db, 'verificationRequests', requestId);
        const verificationSnap = await getDoc(verificationRef);

        if (!verificationSnap.exists()) {
            throw new Error('Verification request not found');
        }

        const userId = verificationSnap.data().userId;

        // Update verification request
        await updateDoc(verificationRef, {
            status: 'rejected',
            reviewedAt: serverTimestamp(),
            reviewedBy: reviewerId,
            rejectionReason: reason,
        });

        // Update user profile
        const profileRef = doc(db, 'profiles', userId);
        await updateDoc(profileRef, {
            verificationStatus: 'rejected',
        });
    },
};
