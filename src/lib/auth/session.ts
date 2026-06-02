import { createClient } from '@/lib/supabase/server';

export async function getCurrentUserId(): Promise<string | null> {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        return data.user.id;
    } catch {
        return null;
    }
}
