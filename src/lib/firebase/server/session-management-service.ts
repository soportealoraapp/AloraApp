import { adminDb, adminAuth } from '../admin';
import { FieldValue } from 'firebase-admin/firestore';
import { authSecurityServerService } from './auth-security-service';

export interface SessionTokens {
    accessToken: string;
    refreshTokenId: string;
    expiresAt: number;
}

export const sessionManagementServerService = {
    /**
     * Called after successful Firebase Auth login.
     * Creates a managed refresh token and invalidates previous sessions if desired.
     */
    async onLoginSuccess(userId: string, firebaseIdToken: string, invalidatePrevious: boolean = false): Promise<SessionTokens> {
        // 1. Optionally invalidate all previous refresh tokens (force single-session)
        if (invalidatePrevious) {
            await authSecurityServerService.invalidateAllSessions(userId, 'new_login');
        }

        // 2. Create new refresh token
        const refreshTokenRef = adminDb.collection('refresh_tokens').doc();
        await refreshTokenRef.set({
            userId,
            consumed: false,
            createdAt: FieldValue.serverTimestamp()
        });

        // 3. Return tokens (access token is the Firebase ID token)
        return {
            accessToken: firebaseIdToken,
            refreshTokenId: refreshTokenRef.id,
            expiresAt: Date.now() + (3600 * 1000) // 1 hour
        };
    },

    /**
     * Rotate refresh token. Returns new tokens or throws if reuse detected.
     */
    async refreshSession(userId: string, oldRefreshTokenId: string): Promise<SessionTokens> {
        // 1. Rotate (will throw and revoke all if reuse detected)
        const newRefreshTokenId = await authSecurityServerService.rotateRefreshToken(userId, oldRefreshTokenId);

        // 2. Generate new Firebase custom token for access
        const customToken = await adminAuth.createCustomToken(userId);

        return {
            accessToken: customToken,
            refreshTokenId: newRefreshTokenId,
            expiresAt: Date.now() + (3600 * 1000)
        };
    },

    /**
     * Called on password change. Revokes all sessions forcing re-login.
     */
    async onPasswordChange(userId: string): Promise<void> {
        await authSecurityServerService.invalidateAllSessions(userId, 'password_change');
        // Also revoke Firebase sessions
        await adminAuth.revokeRefreshTokens(userId);
    },

    /**
     * Called on account deletion. Full cleanup.
     */
    async onAccountDelete(userId: string): Promise<void> {
        // 1. Revoke all custom sessions
        await authSecurityServerService.invalidateAllSessions(userId, 'account_deleted');

        // 2. Revoke Firebase tokens
        await adminAuth.revokeRefreshTokens(userId);

        // 3. Soft-delete profile
        const { softDeleteServerService } = await import('./soft-delete-service');
        await softDeleteServerService.softDelete('profiles', userId);
    },

    /**
     * Validate a refresh token is still valid (not consumed, not expired).
     */
    async validateRefreshToken(refreshTokenId: string): Promise<{ valid: boolean; userId?: string }> {
        const tokenDoc = await adminDb.collection('refresh_tokens').doc(refreshTokenId).get();

        if (!tokenDoc.exists) {
            return { valid: false };
        }

        const data = tokenDoc.data();
        if (data?.consumed === true) {
            return { valid: false };
        }

        return { valid: true, userId: data?.userId };
    }
};
