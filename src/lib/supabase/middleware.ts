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
    try {
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('getUser timeout')), 10000)
        );
        await Promise.race([
            supabase.auth.getUser(),
            timeout,
        ]);
    } catch (err) {
        console.warn('updateSession: getUser failed', err);
    }

    return supabaseResponse
}
