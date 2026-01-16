import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { AloraEvent, EventRSVP } from '../community-types';
import { UserTrustScore } from '../types';

export const eventServerService = {
    async createEvent(userId: string, data: Omit<AloraEvent, 'id' | 'currentParticipants' | 'createdAt' | 'creatorId' | 'status'>): Promise<string> {
        // Validation: Creator must have minimum trust score
        const trustSnap = await adminDb.collection('user_trust_scores').doc(userId).get();
        const trustData = trustSnap.data() as UserTrustScore;

        if (trustData?.score < 80) {
            throw new Error("Puntuación de confianza insuficiente para organizar eventos.");
        }

        const eventRef = adminDb.collection('events').doc();
        const newEvent: AloraEvent = {
            ...data,
            id: eventRef.id,
            creatorId: userId,
            currentParticipants: 0,
            status: 'planned',
            createdAt: new Date()
        };

        await eventRef.set(newEvent);
        return eventRef.id;
    },

    async rsvpToEvent(userId: string, eventId: string): Promise<void> {
        const eventRef = adminDb.collection('events').doc(eventId);
        const eventSnap = await eventRef.get();
        const event = eventSnap.data() as AloraEvent;

        if (!event) throw new Error("Evento no encontrado.");
        if (event.status !== 'planned') throw new Error("Este evento no acepta más registros.");

        // Trust Score Check
        const trustSnap = await adminDb.collection('user_trust_scores').doc(userId).get();
        const trustData = trustSnap.data() as UserTrustScore;

        if ((trustData?.score || 0) < event.minTrustScoreRequired) {
            throw new Error(`Tu confianza (${trustData?.score || 0}) es menor al requisito del evento (${event.minTrustScoreRequired}).`);
        }

        // Capacity Check
        if (event.currentParticipants >= event.maxParticipants) {
            throw new Error("Evento lleno.");
        }

        const rsvpRef = adminDb.collection('event_participants').doc(`${eventId}_${userId}`);
        const newRSVP: EventRSVP = {
            id: rsvpRef.id,
            eventId,
            userId,
            status: 'confirmed',
            createdAt: new Date()
        };

        const batch = adminDb.batch();
        batch.set(rsvpRef, newRSVP);
        batch.update(eventRef, {
            currentParticipants: FieldValue.increment(1)
        });

        await batch.commit();

        // Track Metric
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.trackBusinessEvent('event_rsvp', userId, { eventId, type: event.type });
    }
};
