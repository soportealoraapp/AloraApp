import { prisma } from '@/lib/prisma';

export const verificationService = {
    submitVerification: async (userId: string, selfieUrl: string, idUrl?: string) => {
        try {
            const submission = await prisma.verificationSubmission.create({
                data: {
                    userId,
                    selfieUrl,
                    status: 'pending',
                },
            });
            return { success: true, submissionId: submission.id };
        } catch (error) {
            console.error('Error submitting verification:', error);
            return { success: false, error: 'Error al enviar verificación' };
        }
    },
    getVerificationStatus: async (userId: string) => {
        try {
            const submission = await prisma.verificationSubmission.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                select: { status: true },
            });
            return submission?.status || 'unverified';
        } catch (error) {
            console.error('Error getting verification status:', error);
            return 'unverified';
        }
    },
};
