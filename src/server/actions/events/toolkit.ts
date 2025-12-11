'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function generateTicketQR(ticketId: string) {
    // In real app, sign this with a secret
    return `ALORA_${ticketId}_SECURE`;
}

export async function reportIncident(data: { eventId: string, reporterId: string, description: string, severity: number }) {
    await adminDb.collection('incident_reports').add({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        status: 'open'
    });

    if (data.severity >= 3) {
        // Trigger alert to admin (mock)
        console.log("HIGH SEVERITY INCIDENT REPORTED", data);
    }
}

export async function getAmbassadorStats(userId: string) {
    // Aggregate stats mock
    return {
        eventsHost: 5,
        totalAttendees: 150,
        avgEngagement: 4.8,
        impactScore: 92
    };
}
