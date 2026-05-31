import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const config = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };

    if (!config.apiKey || !config.projectId) {
        return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 });
    }

    return NextResponse.json(config, {
        headers: {
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
        },
    });
}
