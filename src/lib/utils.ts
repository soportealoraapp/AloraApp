import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetch wrapper that handles 401 (session expired) by refreshing the session
 * and retrying the request once.
 */
export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // Session may have expired — try to refresh by calling getUser() which
    // triggers Supabase's automatic token refresh if the JWT is expired.
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error } = await supabase.auth.getUser();
      if (!error) {
        // Token refreshed successfully — retry the original request
        const retryRes = await fetch(url, options);
        return retryRes;
      }
    } catch {
      // Refresh failed — proceed to signOut + redirect
    }
    // Sign out to clear stale session state before redirecting
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Best effort — proceed with redirect even if signOut fails
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login?error=session_expired';
    }
  }
  return res;
}
