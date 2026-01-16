import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface AppealCase {
    id: string;
    userId: string;
    interventionId: string;
    reason: string;
    status: 'pending' | 'under_review' | 'resolved' | 'denied';
    decision?: {
        overturned: boolean;
        comment: string;
        resolvedAt: Date;
        resolvedBy: string;
    };
    createdAt: Date;
}

export const governanceServerService = {
    async submitAppeal(userId: string, interventionId: string, reason: string): Promise<string> {
        const appealRef = adminDb.collection('appeals').doc();
        const newAppeal: AppealCase = {
            id: appealRef.id,
            userId,
            interventionId,
            reason,
            status: 'pending',
            createdAt: new Date()
        };

        await appealRef.set(newAppeal);

        // Log to Consent Ledger as a governance action
        const { consentLedgerServerService } = await import('./consent-ledger-service');
        await (consentLedgerServerService as any).recordConsent(userId, 'appeal_submission', {
            targetId: interventionId,
            ip: 'system'
        });

        return appealRef.id;
    },

    async resolveAppeal(appealId: string, adminId: string, overturned: boolean, comment: string): Promise<void> {
        const appealRef = adminDb.collection('appeals').doc(appealId);
        const appealDoc = await appealRef.get();
        const appeal = appealDoc.data() as AppealCase;

        if (!appeal) throw new Error("Appeal not found");

        await appealRef.update({
            status: 'resolved',
            decision: {
                overturned,
                comment,
                resolvedAt: FieldValue.serverTimestamp(),
                resolvedBy: adminId
            }
        });

        if (overturned) {
            // Restore trust/remove intervention
            const trustRef = adminDb.collection('user_trust_scores').doc(appeal.userId);
            await trustRef.update({
                interventionLevel: 0,
                isWhitelisted: true // Temporary protection to avoid immediate re-intervention
            });

            // Track Legitimay Metric: Overturn Rate
            const { observabilityServerService } = await import('./observability-service');
            await (observabilityServerService as any).trackProductMetric('appeal_overturn', 1);
        }
    }
};
