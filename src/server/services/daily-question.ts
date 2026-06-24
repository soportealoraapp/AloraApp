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
    { question: "¿Qué lugar(es) te gustaría visitar con tu pareja?", category: "lifestyle" },
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

export async function ensureQuestionsSeeded() {
    for (const q of QUESTIONS) {
        await prisma.dailyQuestion.upsert({
            where: { question: q.question },
            update: { category: q.category },
            create: { question: q.question, category: q.category, isActive: false },
        });
    }
}

export async function rotateDailyQuestion(): Promise<{ previousId: string | null; newId: string } | null> {
    // Deactivate current active question
    const current = await prisma.dailyQuestion.findFirst({ where: { isActive: true } });
    if (current) {
        await prisma.dailyQuestion.update({ where: { id: current.id }, data: { isActive: false } });
    }

    // Get all questions ordered by ID for stable rotation
    const allQuestions = await prisma.dailyQuestion.findMany({ orderBy: { createdAt: 'asc' } });
    if (allQuestions.length === 0) {
        await ensureQuestionsSeeded();
        const seeded = await prisma.dailyQuestion.findMany({ orderBy: { createdAt: 'asc' } });
        if (seeded.length === 0) return null;
        const first = seeded[0];
        await prisma.dailyQuestion.update({ where: { id: first.id }, data: { isActive: true, activatedAt: new Date() } });
        return { previousId: null, newId: first.id };
    }

    // Find current index, rotate to next
    const currentIndex = allQuestions.findIndex(q => q.id === current?.id);
    const nextIndex = (currentIndex + 1) % allQuestions.length;
    const next = allQuestions[nextIndex];

    await prisma.dailyQuestion.update({ where: { id: next.id }, data: { isActive: true, activatedAt: new Date() } });
    return { previousId: current?.id ?? null, newId: next.id };
}

export async function getTodayQuestion() {
    // First, ensure there is an active question (rotate if none)
    let activeQuestion = await prisma.dailyQuestion.findFirst({ where: { isActive: true } });

    if (!activeQuestion) {
        await ensureQuestionsSeeded();
        const next = await prisma.dailyQuestion.findFirst({ orderBy: { createdAt: 'asc' } });
        if (next) {
            await prisma.dailyQuestion.update({ where: { id: next.id }, data: { isActive: true, activatedAt: new Date() } });
            activeQuestion = await prisma.dailyQuestion.findUnique({ where: { id: next.id } });
        }
    }

    return activeQuestion;
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

export async function getDailyQuestionForUser(userId: string) {
    const question = await getTodayQuestion();

    if (!question) {
        return null;
    }

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
