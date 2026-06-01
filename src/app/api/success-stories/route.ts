import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/success-stories - public list (approved only)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

        const stories = await prisma.successStory.findMany({
            where: { approved: true },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return NextResponse.json({ stories });
    } catch (error) {
        console.error('Error fetching success stories:', error);
        return NextResponse.json({ stories: [] });
    }
}
