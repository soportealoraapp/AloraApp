import { prisma } from '@/lib/prisma';

export const preferencesService = {
    getPreferences: async (userId: string) => {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { incognitoMode: true, showMeInDiscover: true }
        });
        return {
            incognito: profile?.incognitoMode ?? false,
            showMe: profile?.showMeInDiscover ?? true,
            readReceipts: true,
            notifications: { push: true, email: true }
        };
    },

    updatePreferences: async (userId: string, prefs: { incognito?: boolean; showMe?: boolean }) => {
        const data: Record<string, unknown> = {};
        if (prefs.incognito !== undefined) data.incognitoMode = prefs.incognito;
        if (prefs.showMe !== undefined) data.showMeInDiscover = prefs.showMe;
        if (Object.keys(data).length > 0) {
            await prisma.profile.update({ where: { userId }, data });
        }
        return { success: true };
    },

    toggleIncognito: async (userId: string) => {
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
