import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { compatibilityServerService } from '@/lib/firebase/server/compatibility-service';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { quizId, answers } = await req.json();

        if (!quizId || !answers) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        await compatibilityServerService.saveQuizResults(userId, quizId, answers);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in compatibility save:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
