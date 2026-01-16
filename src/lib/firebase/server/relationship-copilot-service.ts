import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type RelationshipStatus = 'recurring_dating' | 'exclusive' | 'long_term' | 'exploring_health';

export interface RelationshipContext {
    userId: string;
    status: RelationshipStatus;
    notes: string[];
    lastConflictDate?: Date;
    updatedAt: Date;
}

export const relationshipCopilotServerService = {
    async activateRelationshipMode(userId: string, status: RelationshipStatus): Promise<void> {
        const contextRef = adminDb.collection('profiles').doc(userId).collection('relationship_context').doc('current');

        await contextRef.set({
            userId,
            status,
            notes: [],
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // Log institutional action (for privacy audit)
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: 'info',
            category: 'system',
            message: `Relationship Mode activated for user ${userId}`,
            userId
        });
    },

    async prepareConversation(userId: string, topic: string, goal: string): Promise<string> {
        // AI-assisted preparation for difficult talks
        // Topic examples: boundaries, children, moving in, conflict repair

        const prompt = `Topic: ${topic}. Goal: ${goal}.`;
        // In a real implementation, this would call LLM with empathy constraints

        return "Para abordar este tema, intenta empezar con sentimientos propios. Por ejemplo: 'Me he sentido un poco abrumado con...' en lugar de 'Tú siempre haces...'. Tu objetivo es conectar, no ganar.";
    },

    async detectDecisionDependency(userId: string, userQuery: string): Promise<{ isDependent: boolean; advice?: string }> {
        const dependentTriggers = ['debo romper', 'qué hago', 'dime qué decir', 'no sé qué elegir'];

        const isDependent = dependentTriggers.some(trigger => userQuery.toLowerCase().includes(trigger));

        if (isDependent) {
            return {
                isDependent: true,
                advice: "He notado que estás buscando una respuesta externa para una decisión muy personal. Mi papel es acompañarte a reflexionar, pero la elección es tuya. ¿Qué te dice tu instinto en este momento?"
            };
        }

        return { isDependent: false };
    }
};
