import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface EventPayment {
    id: string;
    eventId: string;
    userId: string;
    amount: number;
    status: 'paid' | 'refunded' | 'disputed';
    payoutStatus: 'pending' | 'completed';
    createdAt: Date;
}

export const eventRevenueServerService = {
    async processEventPayment(userId: string, eventId: string, amount: number): Promise<string> {
        const paymentRef = adminDb.collection('event_payments').doc();
        const newPayment: EventPayment = {
            id: paymentRef.id,
            eventId,
            userId,
            amount,
            status: 'paid',
            payoutStatus: 'pending',
            createdAt: new Date()
        };

        await paymentRef.set(newPayment);

        // Track Financial Metric
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.trackFinancialMetric('revenue_ratio', amount, { type: 'event_entry', eventId });

        return paymentRef.id;
    },

    async handleRefundRequest(paymentId: string, reason: string): Promise<boolean> {
        const paymentRef = adminDb.collection('event_payments').doc(paymentId);
        const paymentSnap = await paymentRef.get();

        if (!paymentSnap.exists) return false;

        // Arbitrary business rule: Refund allowed only if > 24h before event
        // (Mock logic for brevity)

        await paymentRef.update({
            status: 'refunded',
            refundReason: reason,
            updatedAt: FieldValue.serverTimestamp()
        });

        return true;
    }
};
