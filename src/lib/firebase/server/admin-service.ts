import { adminAuth, adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AdminAction } from '../types';

const ADMIN_ALLOWLIST = [
    'admin@alora.app',
    'alejandroperezitsur@gmail.com', // User's email for testing
];

export const adminServerService = {
    async isAdmin(email: string): Promise<boolean> {
        return ADMIN_ALLOWLIST.includes(email);
    },

    async getPendingReports() {
        const snapshot = await adminDb.collection('reports')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getRiskProfiles() {
        const snapshot = await adminDb.collection('profiles')
            .where('trustStatus', 'in', ['watchlist', 'restricted'])
            .limit(50)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async takeAction(params: {
        adminId: string;
        targetUserId: string;
        type: AdminAction['type'];
        reason: string;
        reportId?: string;
    }) {
        try {
            // 1. Create action log
            const actionData: AdminAction = {
                id: crypto.randomUUID(),
                adminId: params.adminId,
                targetUserId: params.targetUserId,
                type: params.type,
                reason: params.reason,
                createdAt: new Date(),
            };

            await adminDb.collection('admin_actions').add(actionData);

            // 2. Apply action to user profile
            let trustStatus: any = 'clean';
            if (params.type === 'restrict') trustStatus = 'restricted';
            if (params.type === 'ban') trustStatus = 'banned';
            if (params.type === 'warn') trustStatus = 'watchlist';

            await adminDb.collection('profiles').doc(params.targetUserId).update({
                trustStatus,
                updatedAt: FieldValue.serverTimestamp()
            });

            // 3. Mark report as resolved if applicable
            if (params.reportId) {
                await adminDb.collection('reports').doc(params.reportId).update({
                    status: 'resolved',
                    resolvedAt: FieldValue.serverTimestamp(),
                    resolvedBy: params.adminId
                });
            }

            // 4. Log system event
            await adminDb.collection('system_logs').add({
                event: 'admin_action_taken',
                ...params,
                timestamp: FieldValue.serverTimestamp()
            });

        } catch (error) {
            console.error('Error in takeAction:', error);
            throw error;
        }
    }
};
