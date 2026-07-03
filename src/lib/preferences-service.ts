import { prisma } from '@/lib/prisma';
import { ensureSubscriptionState } from '@/lib/subscription-helper';

export const preferencesService = {
    getPreferences: async (userId: string) => {
        const [profile, notifPrefs] = await Promise.all([
            prisma.profile.findUnique({
                where: { userId },
                select: { incognitoMode: true, showMeInDiscover: true }
            }),
            prisma.notificationPreference.findUnique({
                where: { userId },
                select: { readReceipts: true, notifications: true }
            })
        ]);
        return {
            incognito: profile?.incognitoMode ?? false,
            showMe: profile?.showMeInDiscover ?? true,
            readReceipts: notifPrefs?.readReceipts ?? true,
            notifications: notifPrefs?.notifications ?? true
        };
    },

    updatePreferences: async (userId: string, prefs: { incognito?: boolean; showMe?: boolean; readReceipts?: boolean; notifications?: boolean }) => {
        const { subscriptionStatus } = await ensureSubscriptionState(userId);
        const profileData: Record<string, unknown> = {};
        if (prefs.incognito !== undefined) {
            if (prefs.incognito && subscriptionStatus !== 'plus') {
                return { success: false, error: 'subscription_required', message: 'Modo Incógnito requiere Alora Plus' };
            }
            profileData.incognitoMode = prefs.incognito;
        }
        if (prefs.showMe !== undefined) profileData.showMeInDiscover = prefs.showMe;
        
        const notifData: Record<string, unknown> = {};
        if (prefs.readReceipts !== undefined) notifData.readReceipts = prefs.readReceipts;
        if (prefs.notifications !== undefined) notifData.notifications = prefs.notifications;

        await Promise.all([
            Object.keys(profileData).length > 0 
                ? prisma.profile.update({ where: { userId }, data: profileData })
                : Promise.resolve(),
            Object.keys(notifData).length > 0
                ? prisma.notificationPreference.upsert({
                    where: { userId },
                    update: notifData,
                    create: { userId, ...notifData }
                })
                : Promise.resolve()
        ]);
        
        return { success: true };
    },

    toggleIncognito: async (userId: string) => {
        const { subscriptionStatus } = await ensureSubscriptionState(userId);
        if (subscriptionStatus !== 'plus') {
            return { success: false, error: 'subscription_required', message: 'Modo Incógnito requiere Alora Plus' };
        }
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { incognitoMode: true }
        });
        const newValue = !(profile?.incognitoMode ?? false);
        await prisma.profile.update({
            where: { userId },
            data: { incognitoMode: newValue }
        });
        return { success: true, incognito: newValue };
    },

    toggleShowMe: async (userId: string) => {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { showMeInDiscover: true }
        });
        const newValue = !(profile?.showMeInDiscover ?? true);
        await prisma.profile.update({
            where: { userId },
            data: { showMeInDiscover: newValue }
        });
        return { success: true, showMe: newValue };
    }
};
