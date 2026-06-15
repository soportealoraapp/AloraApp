import { prisma } from '@/lib/prisma';

const QUESTIONS = [
    { question: "Que significa una relacion sana para ti?", category: "values" },
    { question: "Cual es tu mayor meta este ano?", category: "goals" },
    { question: "Que valor nunca negociarias?", category: "values" },
    { question: "Como prefieres resolver un conflicto?", category: "communication" },
    { question: "Que te hace sentir mas conectado/a con alguien?", category: "connection" },
    { question: "Cual es tu forma favorita de pasar un domingo?", category: "lifestyle" },
    { question: "Que aprendiste de tu ultima relacion?", category: "growth" },
    { question: "Que buscas en una primera cita?", category: "dating" },
    { question: "Que opinas sobre la vulnerabilidad en una relacion?", category: "values" },
    { question: "Cual es tu lenguaje del amor principal?", category: "connection" },
    { question: "Que buscas en tu proxima relacion?", category: "goals" },
    { question: "Como te describes en tres palabras?", category: "personality" },
    { question: "Que actividad te gustaria compartir con tu pareja?", category: "lifestyle" },
    { question: "Que es lo mas importante que buscas en una pareja?", category: "values" },
    { question: "Como te gustaria que sea tu vida en 5 anos?", category: "goals" },
];

export async function getTodayQuestion(timezone?: string) {
    const now = new Date();
    let dayOfYear: number;

    if (timezone && timezone !== 'UTC') {
        // Get the date in the user's timezone
        const localDateStr = now.toLocaleString('en-US', { timeZone: timezone });
        const localDate = new Date(localDateStr);
        const start = new Date(localDate.getFullYear(), 0, 0);
        const diff = localDate.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        dayOfYear = Math.floor(diff / oneDay);
    } else {
        // Default to UTC
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const oneDay = 1000 * 60 * 60 * 24;
        dayOfYear = Math.floor(diff / oneDay);
    }

    const questionIndex = dayOfYear % QUESTIONS.length;
    const todayQuestion = QUESTIONS[questionIndex];

    // Check if question exists in DB, create if not
    let dbQuestion = await prisma.dailyQuestion.findFirst({
        where: { question: todayQuestion.question }
    });

    if (!dbQuestion) {
        dbQuestion = await prisma.dailyQuestion.create({
            data: {
                question: todayQuestion.question,
                category: todayQuestion.category,
            }
        });
    }

    return dbQuestion;
}

export async function getUserAnswer(userId: string, questionId: string) {
    return prisma.dailyAnswer.findUnique({
        where: { userId_questionId: { userId, questionId } }
    });
}

export async function submitAnswer(userId: string, questionId: string, answer: string) {
    return prisma.dailyAnswer.upsert({
        where: { userId_questionId: { userId, questionId } },
        update: { answer },
        create: { userId, questionId, answer }
    });
}

export async function getDailyQuestionForUser(userId: string, timezone?: string) {
    const question = await getTodayQuestion(timezone);
    const userAnswer = await getUserAnswer(userId, question.id);

    return {
        question: question.question,
        category: question.category,
        questionId: question.id,
        userAnswer: userAnswer?.answer || null,
        answered: !!userAnswer
    };
}

export async function getLatestAnswer(userId: string): Promise<{ questionId: string; answer: string; createdAt: Date } | null> {
    const row = await prisma.dailyAnswer.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { questionId: true, answer: true, createdAt: true },
    });
    return row;
}

export async function getLatestAnswerForUserById(targetUserId: string) {
    return prisma.dailyAnswer.findFirst({
        where: { userId: targetUserId },
        orderBy: { createdAt: 'desc' },
        select: { questionId: true, answer: true, createdAt: true, question: { select: { question: true, category: true } } },
    });
}
