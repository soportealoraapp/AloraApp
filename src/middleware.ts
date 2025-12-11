import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const session = request.cookies.get('__session');

    // Basic Auth Check for App Routes
    if (!session && request.nextUrl.pathname.startsWith('/app')) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Soft Feature Flags
    // Headers can be read by server components
    const headers = new Headers(request.headers);
    headers.set('x-feature-flags', JSON.stringify({
        aiWingman: true,
        superBoost: true
    }));

    return NextResponse.next({
        request: {
            headers
        }
    });
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
