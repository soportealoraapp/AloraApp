import { createClient } from '../client'

export const authService = {
    async signIn(email: string, password: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            throw new Error(error.message)
        }

        // In Supabase, emailVerified is in user.email_confirmed_at or user.confirmed_at
        // Mapping to legacy interface if needed, but returning user object is standard
        const user = data.user
        return {
            uid: user.id,
            email: user.email,
            emailVerified: !!user.confirmed_at
        }
    },

    async signUp(email: string, password: string, name?: string) {
        const supabase = createClient()
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                }
            }
        })

        if (error) {
            throw new Error(error.message)
        }

        const user = data.user
        return {
            uid: user?.id,
            email: user?.email,
            emailVerified: false // Supabase usually requires verification
        }
    },

    async signInWithGoogle() {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) throw error
    },

    async signInWithApple() {
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) throw error
    },

    async signOut() {
        const supabase = createClient()
        await supabase.auth.signOut()
    },

    async sendPasswordResetEmail(email: string) {
        const supabase = createClient()
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/settings/password-update`,
        })
        if (error) throw error
    }
}
