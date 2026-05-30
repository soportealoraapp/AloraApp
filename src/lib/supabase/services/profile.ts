import { createClient } from '../client'
import { UserProfile } from '@/lib/domain/types'

export const profileService = {
    async getProfile(userId: string): Promise<UserProfile | null> {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('userId', userId)
            .maybeSingle()

        if (error) {
            console.error('Error fetching profile:', error)
            return null
        }

        return data as UserProfile
    },

    async updateLastActive(userId: string): Promise<void> {
        const supabase = createClient()
        await supabase
            .from('profiles')
            .update({ last_active_at: new Date().toISOString() })
            .eq('userId', userId)
    }
}
