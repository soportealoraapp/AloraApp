import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface LogEvent {
    level: LogLevel;
    category: 'auth' | 'monetization' | 'matching' | 'safety' | 'system' | 'safety_drift';
    message: string;
    userId?: string;
    details?: Record<string, any>;
    timestamp?: any;
}

export const monitoringServerService = {
    async log(event: LogEvent): Promise<void> {
        try {
            const logEntry = {
                ...event,
                timestamp: FieldValue.serverTimestamp()
            };

            await adminDb.collection('system_logs').add(logEntry);

            if (event.level === 'critical') {
                // In a real app, this would trigger PagerDuty/Slack/Email
                console.error(`!!! CRITICAL ALERT !!! [${event.category}] ${event.message}`, event.details);
            }
        } catch (error) {
            // Fallback to console if DB fails
            console.error('Failed to log event to Firestore:', error);
        }
    },

    async trackFinancialMetric(type: 'cost_per_match' | 'ai_spend_dau' | 'revenue_ratio', value: number, details?: Record<string, any>): Promise<void> {
        await this.log({
            level: 'info',
            category: 'system',
            message: `Financial Metric: ${type} = ${value}`,
            details: { ...details, value }
        });
    },

    async trackAIUsage(taskKey: string, durationMs: number, estimatedCost: number): Promise<void> {
        await adminDb.collection('ai_cost_logs').add({
            taskKey,
            durationMs,
            estimatedCost,
            timestamp: FieldValue.serverTimestamp()
        });
    }
};
