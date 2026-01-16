import { adminDb } from '../admin';
import { UserCompatibilityProfile } from '../types';
import { FieldValue } from 'firebase-admin/firestore';

export const compatibilityServerService = {
    async saveQuizResults(userId: string, quizId: string, answers: Record<string, number | string>): Promise<void> {
        const profileRef = adminDb.collection('user_compatibility').doc(userId);
        const doc = await profileRef.get();

        const updateData: any = {
            [`quizzes.${quizId}`]: {
                answers,
                completedAt: FieldValue.serverTimestamp()
            },
            lastUpdatedAt: FieldValue.serverTimestamp()
        };

        if (!doc.exists) {
            await profileRef.set({
                userId,
                quizzes: {
                    [quizId]: {
                        answers,
                        completedAt: FieldValue.serverTimestamp()
                    }
                },
                globalValues: [],
                lastUpdatedAt: FieldValue.serverTimestamp()
            });
        } else {
            await profileRef.update(updateData);
        }

        // v1.5: Log engagement metric
        const { metricsServerService } = await import('./metrics-service');
        await metricsServerService.logEvent(userId, 'quiz_completed', { quizId });
    },

    async getCompatibilityProfile(userId: string): Promise<UserCompatibilityProfile | null> {
        const doc = await adminDb.collection('user_compatibility').doc(userId).get();
        if (!doc.exists) return null;
        return doc.data() as UserCompatibilityProfile;
    },

    calculateScore(profile1: UserCompatibilityProfile, profile2: UserCompatibilityProfile): number {
        let totalScore = 0;
        let totalCount = 0;

        const quizIds = Object.keys(profile1.quizzes);
        for (const quizId of quizIds) {
            if (profile2.quizzes[quizId]) {
                const q1Answers = profile1.quizzes[quizId].answers;
                const q2Answers = profile2.quizzes[quizId].answers;

                for (const questionId in q1Answers) {
                    if (q2Answers[questionId] !== undefined) {
                        const val1 = q1Answers[questionId];
                        const val2 = q2Answers[questionId];

                        if (typeof val1 === 'number' && typeof val2 === 'number') {
                            // Scale 1-5
                            const diff = Math.abs(val1 - val2);
                            const normalized = 1 - (diff / 4);
                            totalScore += normalized;
                        } else {
                            // Choice
                            totalScore += val1 === val2 ? 1 : 0;
                        }
                        totalCount++;
                    }
                }
            }
        }

        if (totalCount === 0) return 0;
        return Math.round((totalScore / totalCount) * 100);
    }
};
