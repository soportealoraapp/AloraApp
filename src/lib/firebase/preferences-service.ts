export const preferencesService = {
    getPreferences: async (userId: string) => ({
        incognito: false,
        readReceipts: true,
        notifications: { push: true, email: true }
    }),
    updatePreferences: async (userId: string, prefs: any) => ({ success: true })
};
