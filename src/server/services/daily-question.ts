import { prisma } from '@/lib/prisma';

const QUESTIONS = [
    { question: "¿Qué significa una relación sana para ti?", category: "values" },
    { question: "¿Cuál es tu mayor meta este año?", category: "goals" },
    { question: "¿Qué valor nunca negociarías?", category: "values" },
    { question: "¿Cómo prefieres resolver un conflicto?", category: "communication" },
    { question: "¿Qué te hace sentir más conectado/a con alguien?", category: "connection" },
    { question: "¿Cuál es tu forma favorita de pasar un domingo?", category: "lifestyle" },
    { question: "¿Qué aprendiste de tu última relación?", category: "growth" },
    { question: "¿Qué buscas en una primera cita?", category: "dating" },
    { question: "¿Qué opinas sobre la vulnerabilidad en una relación?", category: "values" },
    { question: "¿Cuál es tu lenguaje del amor principal?", category: "connection" },
    { question: "¿Qué buscas en tu próxima relación?", category: "goals" },
    { question: "¿Cómo te describes en tres palabras?", category: "personality" },
    { question: "¿Qué actividad te gustaría compartir con tu pareja?", category: "lifestyle" },
    { question: "¿Qué es lo más importante que buscas en una pareja?", category: "values" },
    { question: "¿Cómo te gustaría que sea tu vida en 5 años?", category: "goals" },
    { question: "¿Cuál es tu mayor miedo en una relación?", category: "growth" },
    { question: "¿Prefieres las palabras o los hechos para demostrar amor?", category: "communication" },
    { question: "¿Qué hábito de tu pareja más admiras?", category: "values" },
    { question: "¿Cómo manejas el estrés en una relación?", category: "communication" },
    { question: "¿Quéplace(s) te gustaría visitar con tu pareja?", category: "lifestyle" },
    { question: "¿Cuál es tu forma favorita de recibir cariño?", category: "connection" },
    { question: "¿Qué opinas sobre las relaciones a distancia?", category: "values" },
    { question: "¿Cómo celebras los logros de tu pareja?", category: "connection" },
    { question: "¿Qué role juega la familia en tu vida amorosa?", category: "values" },
    { question: "¿Cuál es tu mayor fortaleza en una relación?", category: "personality" },
    { question: "¿Cómo te gustaría conocer a tu pareja ideal?", category: "dating" },
    { question: "¿Qué opinas sobre compartir redes sociales en pareja?", category: "values" },
    { question: "¿Qué actividad nueva te gustaría probar con tu pareja?", category: "lifestyle" },
    { question: "¿Cómo defines el éxito en una relación?", category: "goals" },
    { question: "¿Qué es algo que nunca harías en una relación?", category: "values" },
    { question: "¿Cuál es tu mayor sueño compartido?", category: "goals" },
    { question: "¿Cómo manejas los desacuerdos financieros en pareja?", category: "communication" },
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
