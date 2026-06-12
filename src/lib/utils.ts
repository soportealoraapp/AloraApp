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
    // Session may have expired — try to refresh by hitting an endpoint that
    // refreshes the Supabase session cookie, then retry once.
    try {
      const refreshRes = await fetch('/api/health', { method: 'GET' });
      if (refreshRes.ok) {
        const retryRes = await fetch(url, options);
        return retryRes;
      }
    } catch {
      // Refresh failed — redirect to login
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/login?error=session_expired';
    }
  }
  return res;
}
