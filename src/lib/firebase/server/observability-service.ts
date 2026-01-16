import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export const observabilityServerService = {
    async trackProductMetric(type: 'belonging_rate' | 'meaningful_interaction' | 'event_conversion', value: number, details?: any): Promise<void> {
        await adminDb.collection('product_metrics').add({
            type,
            value,
            details,
            timestamp: FieldValue.serverTimestamp()
        });

        // Log to monitoring service as well
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: 'info',
            category: 'system',
            message: `Product Metric: ${type} = ${value}`,
            details
        });
    },

    async calculateBelongingRate(): Promise<number> {
        // Belonging Rate = (Users in Circles) / (Total Active Users)
        const totalUsers = await adminDb.collection('profiles').where('isActive', '==', true).count().get();
        const usersInCircles = await adminDb.collection('community_members').count().get();

        const countTotal = totalUsers.data().count;
        const countCircles = usersInCircles.data().count;

        return countTotal > 0 ? (countCircles / countTotal) * 100 : 0;
    }
};
