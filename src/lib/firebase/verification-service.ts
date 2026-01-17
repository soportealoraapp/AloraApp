export const verificationService = {
    submitVerification: async (userId: string, photoUrl: string) => ({ success: true }),
    getVerificationStatus: async (userId: string) => 'unverified'
};
