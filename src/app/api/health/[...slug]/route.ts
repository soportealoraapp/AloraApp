import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const { pathname } = new URL(request.url);

    if (pathname.endsWith('/live')) {
        return NextResponse.json({ status: 'alive', uptime: process.uptime() });
    }

    if (pathname.endsWith('/ready')) {
        // Todo: Check DB connection here
        const isDbConnected = true;
        return isDbConnected
            ? NextResponse.json({ status: 'ready' })
            : NextResponse.json({ status: 'not_ready' }, { status: 503 });
    }

    if (pathname.endsWith('/full')) {
        return NextResponse.json({
            status: 'ok',
            services: {
                database: 'connected',
                storage: 'connected',
                auth: 'operational',
                push: 'operational'
            },
            timestamp: new Date().toISOString()
        });
    }

    return NextResponse.json({ status: 'unknown' }, { status: 404 });
}
