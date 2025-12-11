'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface Partner {
    id: string;
    name: string;
    type: 'cafe' | 'bookstore' | 'coworking' | 'university';
    address: string;
    verified: boolean;
    perks: string[];
}

export async function createPartner(data: Omit<Partner, 'id' | 'verified'>) {
    const ref = adminDb.collection('partners').doc();
    await ref.set({
        ...data,
        verified: false, // Explicit admin verify needed
        createdAt: FieldValue.serverTimestamp()
    });
    return ref.id;
}

export async function listPartners(): Promise<Partner[]> {
    const snap = await adminDb.collection('partners').where('verified', '==', true).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Partner));
}
