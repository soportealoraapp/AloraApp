import { createClient } from '../client'

let _supabaseClient: ReturnType<typeof createClient> | null = null;

function getClient() {
    if (!_supabaseClient) {
        _supabaseClient = createClient();
    }
    return _supabaseClient;
}

export const authService = {
    async signIn(email: string, password: string) {
        const supabase = getClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            throw new Error(error.message)
        }

        const user = data.user
        return {
            id: user.id,
            email: user.email,
            emailVerified: !!user.confirmed_at
        }
    },

    async signUp(email: string, password: string, name?: string) {
        const supabase = getClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        })

        if (error) {
            throw new Error(error.message)
        }

        const user = data.user
        return {
            id: user?.id,
            email: user?.email,
            emailVerified: false
        }
    },

    async signInWithGoogle() {
        const supabase = getClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) throw error
    },

    async signInWithApple() {
        const supabase = getClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) throw error
    },

    async signOut() {
        const supabase = getClient()
        await supabase.auth.signOut()
    },

    async sendPasswordResetEmail(email: string) {
        const supabase = getClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/password-update`,
        })
        if (error) throw error
    },

    async resendVerificationEmail(email: string) {
        const supabase = getClient()
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        })
        if (error) throw error
    }
}
