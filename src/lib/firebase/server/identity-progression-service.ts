import { adminDb } from '../admin';
import { UserProfile } from '../types';

export type VisibilityLevel = 'anonymous' | 'pseudonymous' | 'partial' | 'full';

export interface VisibilityState {
    level: VisibilityLevel;
    revealedFields: string[];
    canRequestFull: boolean;
}

export const identityProgressionServerService = {
    async getVisibilityState(viewerId: string, targetId: string): Promise<VisibilityState> {
        // 1. Check if they have a match
        const matchSnap = await adminDb.collection('matches')
            .where('users', 'array-contains', viewerId)
            .get();

        const match = matchSnap.docs.find(doc => {
            const users = doc.data().users;
            return users.includes(targetId);
        });

        if (!match) {
            // No match: Are they in a shared community?
            // For now, default to anonymous in discovery
            return {
                level: 'pseudonymous',
                revealedFields: ['bio', 'interests', 'age'],
                canRequestFull: false
            };
        }

        const matchData = match.data();

        // 2. Check interaction depth
        const messageCountSnap = await adminDb.collection('messages')
            .where('matchId', '==', match.id)
            .count()
            .get();

        const messageCount = messageCountSnap.data().count;

        // 3. Check Trust Score of Viewer
        const viewerTrustSnap = await adminDb.collection('user_trust_scores').doc(viewerId).get();
        const viewerTrust = viewerTrustSnap.data()?.score || 0;

        // Determination Logic
        if (messageCount >= 20 && viewerTrust >= 80) {
            return {
                level: 'full',
                revealedFields: ['*'],
                canRequestFull: true
            };
        }

        if (messageCount >= 5) {
            return {
                level: 'partial',
                revealedFields: ['displayName', 'bio', 'interests', 'photos[0]'],
                canRequestFull: viewerTrust >= 70
            };
        }

        return {
            level: 'pseudonymous',
            revealedFields: ['bio', 'interests'],
            canRequestFull: false
        };
    },

    async requestFullReveal(initiatorId: string, targetId: string, matchId: string): Promise<void> {
        // Log intent in Consent Ledger (future implementation)
        await adminDb.collection('reveal_requests').add({
            initiatorId,
            targetId,
            matchId,
            status: 'pending',
            timestamp: new Date()
        });
    }
};
