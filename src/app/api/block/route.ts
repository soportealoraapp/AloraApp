import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json({ error: 'Endpoint deprecated' }, { status: 501 });
}
export async function GET() {
    return NextResponse.json({ error: 'Endpoint deprecated' }, { status: 501 });
}
