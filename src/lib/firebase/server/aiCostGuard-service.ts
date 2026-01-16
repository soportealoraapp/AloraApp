import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type AIPriority = 'critical' | 'deferred' | 'optional';

export interface AIExecutionOptions {
    priority: AIPriority;
    ttlHours?: number;
    fallbackValue?: any;
    bypassCache?: boolean;
}

export const aiCostGuardServerService = {
    /**
     * Executes an AI task with caching and cost control logic.
     */
    async executeWithGuard<T>(
        taskKey: string,
        executionFn: () => Promise<T>,
        options: AIExecutionOptions
    ): Promise<T> {
        try {
            const cacheRef = adminDb.collection('ai_cache').doc(taskKey);

            // 1. Cache Check
            if (!options.bypassCache) {
                const cacheSnap = await cacheRef.get();
                if (cacheSnap.exists) {
                    const data = cacheSnap.data();
                    const expiresAt = data?.expiresAt?.toDate();
                    if (expiresAt && expiresAt > new Date()) {
                        return data?.result as T;
                    }
                }
            }

            // 2. Cost/Budget Check (Intervention Level Check)
            // If system is under heavy load or cost limit reached, use fallback
            const isSystemUnderStress = await this.checkSystemStress();
            if (isSystemUnderStress && options.priority !== 'critical') {
                return options.fallbackValue;
            }

            // 3. Execute AI Task
            const startTime = Date.now();
            const result = await executionFn();
            const duration = Date.now() - startTime;

            // 4. Save to Cache & Log
            const ttl = options.ttlHours || 24;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + ttl);

            await cacheRef.set({
                result,
                expiresAt,
                createdAt: FieldValue.serverTimestamp(),
                durationMs: duration
            });

            // Log Token Usage / Cost via Monitoring Service
            const { monitoringServerService } = await import('./monitoring-service');
            await monitoringServerService.trackAIUsage(taskKey, duration, this.estimateCost(duration));

            return result;

        } catch (error) {
            console.error(`AI Task ${taskKey} failed:`, error);
            if (options.fallbackValue !== undefined) return options.fallbackValue;
            throw error;
        }
    },

    async checkSystemStress(): Promise<boolean> {
        // Mock: Check flag in system_config or recent error rate
        const config = await adminDb.collection('system_config').doc('ai_budget').get();
        return config.data()?.isKillSwitchActive || false;
    },

    estimateCost(durationMs: number): number {
        // Heuristic: $0.01 per second of processing (highly variable)
        return (durationMs / 1000) * 0.01;
    }
};
