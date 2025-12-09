import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    OAuthProvider,
} from 'firebase/auth';
import { auth } from './config';

export const authService = {
    // Sign up with email and password
    async signUp(email: string, password: string, displayName: string): Promise<User> {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName });
        await sendEmailVerification(user);

        return user;
    },

    // Sign in with email and password
    async signIn(email: string, password: string): Promise<User> {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },

    // Sign in with Google
    async signInWithGoogle(): Promise<User> {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    },

    // Sign in with Apple
    async signInWithApple(): Promise<User> {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        provider.addScope('name');
        const userCredential = await signInWithPopup(auth, provider);
        return userCredential.user;
    },

    // Sign out
    async signOut(): Promise<void> {
        await signOut(auth);
    },

    // Reset password
    async resetPassword(email: string): Promise<void> {
        await sendPasswordResetEmail(auth, email);
    },

    // Resend verification email
    async resendVerification(): Promise<void> {
        const user = auth.currentUser;
        if (user && !user.emailVerified) {
            await sendEmailVerification(user);
        }
    },

    // Get current user
    getCurrentUser(): User | null {
        return auth.currentUser;
    },

    // Get ID token
    async getIdToken(): Promise<string | null> {
        const user = auth.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    },
};
