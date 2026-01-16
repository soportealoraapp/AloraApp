import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const softDeleteServerService = {
    /**
     * Standard soft-delete for any document.
     * Marks 'deletedAt' and 'isActive: false'.
     */
    async softDelete(collection: string, docId: string): Promise<void> {
        await adminDb.collection(collection).doc(docId).update({
            deletedAt: FieldValue.serverTimestamp(),
            isActive: false,
            updatedAt: FieldValue.serverTimestamp()
        });

        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: 'info',
            category: 'system',
            message: `Soft-delete executed for ${collection}/${docId}`,
            details: { collection, docId }
        });
    },

    /**
     * Purge old soft-deleted data (GDPR Right to be Forgotten).
     * Typically run via a cron job.
     */
    async purgeDeletedData(collection: string, retentionDays: number = 30): Promise<number> {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - retentionDays);

        const snap = await adminDb.collection(collection)
            .where('isActive', '==', false)
            .where('deletedAt', '<', threshold)
            .get();

        const batch = adminDb.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));

        await batch.commit();
        return snap.size;
    }
};
