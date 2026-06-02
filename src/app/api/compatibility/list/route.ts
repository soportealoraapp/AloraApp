import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const rows = await prisma.$queryRaw<Array<{ quizId: string; score: number; archetype: string; createdAt: Date }>>`
            SELECT "quizId", score, archetype, "createdAt"
            FROM quiz_results
            WHERE "userId" = ${user.id}
            ORDER BY "createdAt" DESC
        `;

        return NextResponse.json({
            completedQuizzes: rows.map(r => ({
                quizId: r.quizId,
                score: r.score,
                archetype: r.archetype,
                completedAt: r.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error('Error listing quiz results:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
