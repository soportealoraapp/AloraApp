import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateQuizScore, determineArchetype } from '@/lib/compatibility/quizzes';
import { getServerUser } from '@/lib/middleware/auth';

export async function POST(request: Request) {
    try {
        const user = await getServerUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { quizId, answers } = await request.json();

        if (!quizId || !answers) {
            return NextResponse.json({ error: 'Missing quizId or answers' }, { status: 400 });
        }

        const score = calculateQuizScore(quizId, answers);
        const archetype = determineArchetype(quizId, score);

        // Use raw upsert since Prisma client needs regeneration
        await prisma.$executeRaw`
            INSERT INTO quiz_results (id, "userId", "quizId", answers, score, archetype, "createdAt")
            VALUES (gen_random_uuid(), ${user.id}, ${quizId}, ${JSON.stringify(answers)}::jsonb, ${score}, ${archetype}, NOW())
            ON CONFLICT ("userId", "quizId")
            DO UPDATE SET answers = ${JSON.stringify(answers)}::jsonb, score = ${score}, archetype = ${archetype}
        `;

        return NextResponse.json({ success: true, score, archetype });
    } catch (error) {
        console.error('Error saving quiz:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
