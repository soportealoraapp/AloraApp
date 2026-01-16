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

    async trackBusinessEvent(type: 'subscription_purchased' | 'boost_activated' | 'referral_used' | 'report_filed' | 'like_sent' | 'match_created' | 'saved_conversation' | 'safety_intervention', userId: string, details?: Record<string, any>): Promise<void> {
        await this.log({
            level: 'info',
            category: (type === 'report_filed' || type === 'match_created' || type === 'like_sent' || type === 'saved_conversation' || type === 'safety_intervention') ? 'safety' : 'monetization',
            message: `Business Event: ${type}`,
            userId,
            details
        });
    }
};
