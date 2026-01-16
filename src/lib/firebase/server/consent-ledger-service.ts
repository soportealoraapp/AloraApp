import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type ConsentType = 'match_accept' | 'identity_reveal_full' | 'event_rsvp' | 'data_processing_v1';

export interface ConsentRecord {
    userId: string;
    targetId?: string;
    type: ConsentType;
    ip?: string;
    userAgent?: string;
    timestamp: any;
    version: string;
}

export const consentLedgerServerService = {
    async recordConsent(userId: string, type: ConsentType, details?: { targetId?: string; ip?: string; userAgent?: string }): Promise<void> {
        const record: ConsentRecord = {
            userId,
            targetId: details?.targetId,
            type,
            ip: details?.ip,
            userAgent: details?.userAgent,
            timestamp: FieldValue.serverTimestamp(),
            version: '2.5.0'
        };

        // Write to an immutable/append-only collection
        await adminDb.collection('consent_ledger').add(record);

        // Also update the user's profile with latest consent timestamp
        await adminDb.collection('profiles').doc(userId).update({
            [`lastConsent.${type}`]: FieldValue.serverTimestamp()
        });

        // Track safety metric
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.trackBusinessEvent('safety_intervention', userId, { type: 'consent_recorded', consentType: type });
    }
};
