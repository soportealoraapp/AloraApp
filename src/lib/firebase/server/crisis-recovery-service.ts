import { adminDb } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';

export type CrisisDomain = 'global' | 'events' | 'chat' | 'communities';

export interface CrisisAction {
    id: string;
    domain: CrisisDomain;
    action: 'freeze' | 'unfreeze' | 'broadcast';
    reason: string;
    authorizedBy: string;
    timestamp: Date;
}

export const crisisRecoveryServerService = {
    async activateEmergencyFreeze(domain: CrisisDomain, reason: string, adminId: string): Promise<void> {
        // 1. Log the institutional action
        const actionRef = adminDb.collection('crisis_actions').doc();
        await actionRef.set({
            domain,
            action: 'freeze',
            reason,
            authorizedBy: adminId,
            timestamp: FieldValue.serverTimestamp()
        });

        // 2. Set Global Kill-Switch in Config
        await adminDb.collection('system_config').doc('emergency_switches').set({
            [domain]: {
                active: true,
                reason,
                lockedAt: FieldValue.serverTimestamp()
            }
        }, { merge: true });

        // 3. Notify all relevant moderators
        const { monitoringServerService } = await import('./monitoring-service');
        await monitoringServerService.log({
            level: 'critical',
            category: 'system',
            message: `EMERGENCY FREEZE ACTIVATED: ${domain}`,
            details: { reason, adminId }
        });
    },

    async broadcastInstitutionalMessage(title: string, body: string): Promise<void> {
        // Send a high-priority system notification to ALL active users
        // This is an institutional tool for crisis transparency
        console.log(`[INSTITUTIONAL BROADCAST] ${title}: ${body}`);

        // Mocking massive notification dispatch
        await adminDb.collection('system_notifications').add({
            title,
            body,
            type: 'institutional',
            timestamp: FieldValue.serverTimestamp()
        });
    }
};
