import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'Endpoint deprecated or not implemented' }, { status: 501 });
}
