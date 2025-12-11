'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface Event {
    id: string;
    title: string;
    description: string;
    date: Date;
    hostId: string;
    price: number;
    attendees: string[];
}

export async function createEvent(data: Omit<Event, 'id' | 'attendees'>) {
    const ref = adminDb.collection('events').doc();
    await ref.set({
        ...data,
        attendees: [],
        createdAt: FieldValue.serverTimestamp()
    });
    return ref.id;
}

export async function getEvents(): Promise<Event[]> {
    const snapshot = await adminDb.collection('events')
        .where('date', '>', new Date())
        .orderBy('date', 'asc')
        .limit(20)
        .get();

    return snapshot.docs.map(doc => {
        const d = doc.data();
        return {
            id: doc.id,
            ...d,
            date: d.date.toDate()
        } as Event;
    });
}

export async function rsvpEvent(eventId: string, userId: string) {
    await adminDb.collection('events').doc(eventId).update({
        attendees: FieldValue.arrayUnion(userId)
    });

    // Create ticket record
    await adminDb.collection('event_tickets').add({
        eventId,
        userId,
        status: 'active',
        purchasedAt: FieldValue.serverTimestamp()
    });
}
