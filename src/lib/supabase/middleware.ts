import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function createClient(request: NextRequest, response: NextResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = await createClient(request, supabaseResponse);
    let user: { id: string } | null = null;
    let authError = false;
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), 10000)
        );
        const { data, error } = await Promise.race([
            supabase.auth.getUser(),
            timeout,
        ]);
        if (error) {
            authError = true;
        }
        user = data.user;
    } catch (err) {
        authError = true;
        console.warn('updateSession: getUser failed', err instanceof Error ? err.message : 'unknown');
    }

    // If getUser failed or timed out, create a fresh response WITHOUT refreshed cookies
    // to prevent half-refreshed tokens from being sent to the client
    if (authError || !user) {
        const freshResponse = NextResponse.next({
            request: { headers: request.headers },
        });
        return { supabaseResponse: freshResponse, user: null };
    }

    return { supabaseResponse, user }
}
