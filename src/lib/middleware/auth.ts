import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function authMiddleware(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        return decodedToken;
    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}

export async function requireAuth(request: NextRequest) {
    const result = await authMiddleware(request);
    if (result instanceof NextResponse) {
        return result; // Return error response
    }
    return result; // Return decoded token
}
