import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { Report } from '../types';

export const reportServerService = {
    async createReport(params: {
        reporterId: string;
        reportedId: string;
        category: Report['category'];
        matchId?: string;
        messageIds?: string[];
        description?: string;
    }): Promise<string> {
        try {
            // 1. Rate Limit Check (e.g., max 3 reports per hour)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentReports = await adminDb.collection('reports')
                .where('reporterId', '==', params.reporterId)
                .where('createdAt', '>', oneHourAgo)
                .get();

            if (recentReports.size >= 3) {
                throw new Error("Has alcanzado el límite de reportes por ahora. Inténtalo más tarde.");
            }

            // 2. Persist Report
            const reportData = {
                ...params,
                status: 'pending',
                createdAt: FieldValue.serverTimestamp(),
            };

            const reportRef = await adminDb.collection('reports').add(reportData);

            // 4. Trigger Trust Score update (async)
            const { trustServerService } = await import('./trust-service');
            trustServerService.updateTrustScore(params.reportedId);

            return reportRef.id;
        } catch (error) {
            console.error('Error in createReport:', error);
            throw error;
        }
    }
};
