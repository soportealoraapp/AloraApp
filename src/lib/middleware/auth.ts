import { NextRequest, NextResponse } from 'next/server';

export async function authMiddleware(request: NextRequest) {
    // Stub for Supabase Auth Middleware (handled in src/middleware.ts usually)
    // For API routes, we'd use createServerClient and getUser
    return { uid: 'stub-user-id' };
}

export async function requireAuth(request: NextRequest) {
    return { uid: 'stub-user-id' };
}
