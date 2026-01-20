export const verificationService = {
    submitVerification: async (userId: string, selfieUrl: string, idUrl?: string) => ({ success: true }),
    getVerificationStatus: async (userId: string) => 'unverified'
};
