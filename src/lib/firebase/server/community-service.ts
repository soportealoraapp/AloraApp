import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { CommunityCircle, CommunityPost } from '../community-types';

export const communityServerService = {
    async createCircle(data: Omit<CommunityCircle, 'id' | 'memberCount' | 'createdAt'>): Promise<string> {
        const circleRef = adminDb.collection('communities').doc();
        const newCircle: CommunityCircle = {
            ...data,
            id: circleRef.id,
            memberCount: 0,
            createdAt: new Date()
        };
        await circleRef.set(newCircle);
        return circleRef.id;
    },

    async joinCircle(userId: string, circleId: string): Promise<void> {
        const circleRef = adminDb.collection('communities').doc(circleId);
        await circleRef.update({
            memberCount: FieldValue.increment(1)
        });

        // Tracking participation for metrics
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.trackBusinessEvent('community_join', userId, { circleId });
    },

    async createPost(userId: string, circleId: string, content: string): Promise<string> {
        // v2.4: Anti-abuse shadow limit check
        // (Pseudonym logic would be here)
        const pseudonym = `User_${userId.slice(0, 4)}`;

        const postRef = adminDb.collection('community_posts').doc();
        const newPost: CommunityPost = {
            id: postRef.id,
            circleId,
            authorId: userId,
            authorPseudonym: pseudonym,
            content,
            reactionCount: 0,
            createdAt: new Date(),
            isModerated: false
        };

        await postRef.set(newPost);
        return postRef.id;
    }
};
