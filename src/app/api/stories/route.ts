import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const matches = await prisma.match.findMany({
            where: {
                OR: [{ user1Id: user.id }, { user2Id: user.id }],
                isActive: true,
            },
            select: { user1Id: true, user2Id: true },
        });

        const matchUserIds = matches.map(m =>
            m.user1Id === user.id ? m.user2Id : m.user1Id
        );

        const allUserIds = [user.id, ...matchUserIds];

        const stories = await prisma.$queryRaw`
            SELECT
                s.id,
                s."userId",
                s.content,
                s.type,
                s."expiresAt",
                s."createdAt",
                p."displayName",
                p.photos,
                (
                    SELECT COUNT(*)::int
                    FROM story_views sv
                    WHERE sv."storyId" = s.id
                ) as "viewCount",
                (
                    SELECT EXISTS(
                        SELECT 1 FROM story_views sv
                        WHERE sv."storyId" = s.id AND sv."userId" = ${user.id}
                    )
                ) as "viewedByMe"
            FROM stories s
            JOIN profiles p ON p."userId" = s."userId"
            WHERE s."userId" = ANY(${allUserIds})
              AND s."expiresAt" > NOW()
            ORDER BY s."createdAt" DESC
        `;

        const grouped = (stories as any[]).reduce((acc: any, story: any) => {
            if (!acc[story.userId]) {
                acc[story.userId] = {
                    userId: story.userId,
                    displayName: story.displayName,
                    photo: story.photos?.[0] || '/placeholder.svg',
                    stories: [],
                };
            }
            acc[story.userId].stories.push({
                id: story.id,
                content: story.content,
                type: story.type,
                expiresAt: story.expiresAt,
                createdAt: story.createdAt,
                viewCount: story.viewCount,
                viewedByMe: story.viewedByMe,
            });
            return acc;
        }, {});

        return NextResponse.json({ stories: Object.values(grouped) });
    } catch (error) {
        console.error('Error fetching stories:', error);
        return NextResponse.json({ stories: [] });
    }
}

export async function POST(request: NextRequest) {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { content, type } = await request.json();

        if (!content || !type) {
            return NextResponse.json({ error: 'Missing content or type' }, { status: 400 });
        }

        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const story = await prisma.$executeRaw`
            INSERT INTO stories (id, "userId", content, type, "expiresAt", "createdAt")
            VALUES (gen_random_uuid()::text, ${user.id}, ${content}, ${type}, ${expiresAt}, NOW())
        `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error creating story:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
