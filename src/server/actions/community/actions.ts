'use server';

import { adminDb } from '../../firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getHeartScore } from '../../actions/heartscore';
import { getStarsReceived } from '../../actions/stars';

export async function becomeGuide(userId: string) {
    const score = await getHeartScore(userId);
    const stars = await getStarsReceived(userId);
    // Assuming we had socialEnergy stored in user profile or calculated
    const userDoc = await adminDb.collection('profiles').doc(userId).get();
    const socialEnergy = userDoc.data()?.socialEnergy || 0;

    if (score.score > 200 && stars >= 12 && socialEnergy > 75) {
        await adminDb.collection('profiles').doc(userId).update({
            roles: FieldValue.arrayUnion('GUIDE'),
            guideSince: FieldValue.serverTimestamp()
        });
        return { success: true };
    }
    return { success: false, reason: 'Requirements not met' };
}

export async function applyForAmbassador(userId: string, application: { region: string, motivation: string }) {
    await adminDb.collection('ambassador_applications').add({
        userId,
        ...application,
        status: 'pending',
        createdAt: FieldValue.serverTimestamp()
    });
}
