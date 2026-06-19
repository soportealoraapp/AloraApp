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
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), 10000)
        );
        const { data } = await Promise.race([
            supabase.auth.getUser(),
            timeout,
        ]);
        user = data.user;
    } catch (err) {
        console.warn('updateSession: getUser failed', err);
    }

    return { supabaseResponse, user }
}
