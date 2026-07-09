import { prisma } from '@/lib/prisma';

/**
 * Questions organized by category. This is the single source of truth; the
 * flat `QUESTIONS` list is derived below in a round-robin order so that
 * consecutive days naturally vary in category.
 */
export const QUESTION_BANK: Record<string, string[]> = {
    values: [
        "¿Qué significa una relación sana para ti?",
        "¿Qué valor nunca negociarías?",
        "¿Qué opinas sobre la vulnerabilidad en una relación?",
        "¿Qué es lo más importante que buscas en una pareja?",
        "¿Qué hábito de tu pareja más admiras?",
        "¿Qué opinas sobre las relaciones a distancia?",
        "¿Qué role juega la familia en tu vida amorosa?",
        "¿Qué opinas sobre compartir redes sociales en pareja?",
        "¿Cómo sabes que alguien es la persona indicada?",
        "¿Qué importancia le das a la familia?",
        "¿Qué valoras más: la honestidad o la lealtad?",
        "¿Cuál es tu mayor red flag en alguien?",
        "¿Qué es algo que nunca harías en una relación?",
    ],
    goals: [
        "¿Cuál es tu mayor meta este año?",
        "¿Qué buscas en tu próxima relación?",
        "¿Cómo te gustaría que sea tu vida en 5 años?",
        "¿Cómo defines el éxito en una relación?",
        "¿Cuál es tu mayor sueño compartido?",
        "¿Cuál es tu mayor meta a largo plazo?",
        "¿Cuál es tu mayor sueño profesional?",
        "¿Qué meta tienes para este mes?",
        "¿Cómo defines el éxito personal?",
    ],
    communication: [
        "¿Cómo prefieres resolver un conflicto?",
        "¿Prefieres las palabras o los hechos para demostrar amor?",
        "¿Cómo manejas el estrés en una relación?",
        "¿Cómo manejas los desacuerdos financieros en pareja?",
        "¿Qué es para ti una comunicación sana?",
        "¿Prefieres mensajes largos o llamadas?",
    ],
    connection: [
        "¿Qué te hace sentir más conectado/a con alguien?",
        "¿Cuál es tu lenguaje del amor principal?",
        "¿Cuál es tu forma favorita de recibir cariño?",
        "¿Cómo celebras los logros de tu pareja?",
        "¿Qué pequeño gesto te hace sentir amado/a?",
        "¿Qué tipo de energía buscas en una relación?",
        "¿Qué es lo que más te enamora de una persona?",
        "¿Qué canción te hace pensar en el amor?",
        "¿Cómo mantienes viva la chispa en una relación?",
        "¿Cuál es tu forma favorita de dar las buenas noches?",
    ],
    lifestyle: [
        "¿Cuál es tu forma favorita de pasar un domingo?",
        "¿Qué actividad te gustaría compartir con tu pareja?",
        "¿Qué lugar(es) te gustaría visitar con tu pareja?",
        "¿Qué actividad nueva te gustaría probar con tu pareja?",
        "¿Prefieres una cita tranquila en casa o una aventura?",
        "¿Qué no puede faltar en tu vida diaria?",
        "¿Qué lugar te hace sentir en paz?",
        "¿Cuál es tu cita ideal para un domingo lluvioso?",
        "¿Qué hábito te gustaría compartir con tu pareja?",
    ],
    growth: [
        "¿Qué aprendiste de tu última relación?",
        "¿Cuál es tu mayor miedo en una relación?",
        "¿Cuál ha sido tu mayor aprendizaje en el amor?",
        "¿Cómo celebras los pequeños logros?",
        "¿Cómo te cuidas cuando estás triste?",
        "¿Qué te gustaría aprender de tu próxima pareja?",
        "¿Cuál es tu mayor miedo a superar?",
    ],
    dating: [
        "¿Qué buscas en una primera cita?",
        "¿Cómo te gustaría conocer a tu pareja ideal?",
    ],
    personality: [
        "¿Cómo te describes en tres palabras?",
        "¿Cuál es tu mayor fortaleza en una relación?",
        "¿Cuál es tu mayor fortaleza como pareja?",
        "¿Prefieres planes espontáneos o todo organizado?",
        "¿Qué te hace reír sin parar?",
        "¿Qué cualidad admiras más en los demás?",
    ],
};

export const QUESTION_CATEGORIES = Object.keys(QUESTION_BANK);

/** Flat list with round-robin ordering so consecutive questions differ in category. */
export const QUESTIONS: { question: string; category: string }[] = (() => {
    const byCategory = QUESTION_CATEGORIES.map((cat) =>
        QUESTION_BANK[cat].map((q) => ({ question: q, category: cat }))
    );
    const result: { question: string; category: string }[] = [];
    let i = 0;
    let added = true;
    while (added) {
        added = false;
        for (const list of byCategory) {
            if (i < list.length) {
                result.push(list[i]);
                added = true;
            }
        }
        i++;
    }
    return result;
})();

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
    const current = await prisma.dailyQuestion.findFirst({ where: { isActive: true } });

    // Idempotent per UTC day: if the active question was already rotated today,
    // leave it as-is so a double cron run doesn't skip a question.
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    if (current?.activatedAt && new Date(current.activatedAt) >= todayStart) {
        return { previousId: null, newId: current.id };
    }

    // Deactivate current active question
    if (current) {
        await prisma.dailyQuestion.update({ where: { id: current.id }, data: { isActive: false } });
    }

    // Get all questions ordered by creation for stable rotation (seeded round-robin)
    const allQuestions = await prisma.dailyQuestion.findMany({ orderBy: { createdAt: 'asc' } });
    if (allQuestions.length === 0) {
        await ensureQuestionsSeeded();
        const seeded = await prisma.dailyQuestion.findMany({ orderBy: { createdAt: 'asc' } });
        if (seeded.length === 0) return null;
        const first = seeded[0];
        await prisma.dailyQuestion.update({ where: { id: first.id }, data: { isActive: true, activatedAt: new Date() } });
        return { previousId: null, newId: first.id };
    }

    // Rotate to the next question, preferring one with a different category
    // than today's so consecutive days vary in theme (independent of DB order).
    const currentIndex = allQuestions.findIndex(q => q.id === current?.id);
    const currentCategory = current?.category;
    let nextIndex = (currentIndex + 1) % allQuestions.length;
    if (currentCategory) {
        for (let step = 1; step <= allQuestions.length; step++) {
            const idx = (currentIndex + step) % allQuestions.length;
            if (allQuestions[idx].category !== currentCategory) {
                nextIndex = idx;
                break;
            }
        }
    }
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
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // answer visible for 24h
    return prisma.dailyAnswer.upsert({
        where: { userId_questionId: { userId, questionId } },
        update: { answer, expiresAt },
        create: { userId, questionId, answer, expiresAt }
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
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { questionId: true, answer: true, createdAt: true },
    });
    return row;
}

export async function getAnswerForToday(userId: string) {
    const question = await getTodayQuestion();
    if (!question) return null;

    const answer = await getUserAnswer(userId, question.id);
    if (!answer) return null;

    return {
        questionId: question.id,
        question: question.question,
        category: question.category,
        answer: answer.answer,
    };
}

export async function getLatestAnswerForUserById(targetUserId: string) {
    return prisma.dailyAnswer.findFirst({
        where: { userId: targetUserId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: { questionId: true, answer: true, createdAt: true, question: { select: { question: true, category: true } } },
    });
}
