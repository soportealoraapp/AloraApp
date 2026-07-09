import { prisma } from '@/lib/prisma';

export const MAX_USER_PROMPTS = 5;
export const MIN_USER_PROMPTS = 3;
export const PROMPT_ANSWER_MAX = 140;

const PROMPTS: { text: string; category: string }[] = [
    { text: 'El lugar perfecto para una primera cita es...', category: 'dating' },
    { text: 'Mi forma ideal de una noche de domingo es...', category: 'lifestyle' },
    { text: 'Lo que más me hace reír es...', category: 'personality' },
    { text: 'Si fuera a cualquier lugar del mundo mañana, iría a...', category: 'travel' },
    { text: 'Mi canción favorita para bailar es...', category: 'music' },
    { text: 'Una meta que tengo este año es...', category: 'goals' },
    { text: 'Lo que busco en una pareja es...', category: 'dating' },
    { text: 'Mi plan perfecto para una cita es...', category: 'dating' },
    { text: 'Algo aleatorio que me encanta es...', category: 'personality' },
    { text: 'La mejor forma de relajarme es...', category: 'lifestyle' },
    { text: 'Mi serie o película favorita es...', category: 'lifestyle' },
    { text: 'Si pudiera cenar con alguien, sería con...', category: 'personality' },
    { text: 'Lo que más valoro en una amistad es...', category: 'connection' },
    { text: 'Mi pasatiempo favorito los fines de semana es...', category: 'lifestyle' },
    { text: 'Una comida que nunca diría que no es...', category: 'lifestyle' },
    { text: 'Lo que me hace sentir más cerca de alguien es...', category: 'connection' },
    { text: 'Mi viaje soñado incluiría...', category: 'travel' },
    { text: 'Una cosa sobre mí que pocos saben es...', category: 'personality' },
    { text: 'Mi estilo de cita ideal es...', category: 'dating' },
    { text: 'La música que siempre pongo de fondo es...', category: 'music' },
    { text: 'Algo que quiero probar contigo es...', category: 'dating' },
    { text: 'Mi definición de una buena conversación es...', category: 'connection' },
    { text: 'El elogio que más me gusta recibir es...', category: 'personality' },
    { text: 'Un lugar en la ciudad donde me encontrarías es...', category: 'lifestyle' },
    { text: 'Lo que me motiva cada día es...', category: 'goals' },
    { text: 'Mi manera favorita de sorprender a alguien es...', category: 'connection' },
    { text: 'Una aventura que me gustaría tener es...', category: 'travel' },
    { text: 'Si tuvieras que describirme en 3 emojis serían...', category: 'personality' },
    { text: 'Lo que no puede faltar en una cita es...', category: 'dating' },
    { text: 'Mi artista o banda de cabecera es...', category: 'music' },
    { text: 'Una tradición que me gustaría crear en pareja es...', category: 'connection' },
    { text: 'La mejor parte de conocer a alguien nuevo es...', category: 'dating' },
];

export async function ensurePromptTemplatesSeeded() {
    const count = await prisma.promptTemplate.count();
    if (count > 0) return;

    let order = 0;
    for (const p of PROMPTS) {
        await prisma.promptTemplate.create({ data: { text: p.text, category: p.category, order: order++ } });
    }
}

export async function getPromptTemplates() {
    await ensurePromptTemplatesSeeded();
    return prisma.promptTemplate.findMany({ orderBy: { order: 'asc' } });
}

export interface UserPromptView {
    id: string;
    promptId: string;
    question: string;
    answer: string;
    position: number;
}

export async function getUserPrompts(userId: string): Promise<UserPromptView[]> {
    const rows = await prisma.userPrompt.findMany({
        where: { userId },
        include: { prompt: { select: { text: true } } },
        orderBy: { position: 'asc' },
    });

    return rows.map(r => ({
        id: r.id,
        promptId: r.promptId,
        question: r.prompt.text,
        answer: r.answer,
        position: r.position,
    }));
}

export async function upsertUserPrompt(
    userId: string,
    promptId: string,
    answer: string,
    position?: number
): Promise<UserPromptView> {
    const trimmed = answer.trim();
    if (!trimmed) throw new Error('La respuesta no puede estar vacía');
    if (trimmed.length > PROMPT_ANSWER_MAX) throw new Error(`La respuesta no puede superar ${PROMPT_ANSWER_MAX} caracteres`);

    const prompt = await prisma.promptTemplate.findUnique({ where: { id: promptId } });
    if (!prompt) throw new Error('Plantilla de pregunta no válida');

    const existingCount = await prisma.userPrompt.count({ where: { userId } });

    // Determine position: use provided, or append at the end (respecting the max)
    let finalPosition = position ?? existingCount;
    if (existingCount >= MAX_USER_PROMPTS && position === undefined) {
        throw new Error(`Solo puedes tener hasta ${MAX_USER_PROMPTS} preguntas en tu perfil`);
    }

    const row = await prisma.userPrompt.upsert({
        where: { userId_promptId: { userId, promptId } },
        update: { answer: trimmed, position: finalPosition },
        create: { userId, promptId, answer: trimmed, position: finalPosition },
        include: { prompt: { select: { text: true } } },
    });

    return { id: row.id, promptId: row.promptId, question: row.prompt.text, answer: row.answer, position: row.position };
}

export async function deleteUserPrompt(userId: string, id: string) {
    await prisma.userPrompt.deleteMany({ where: { id, userId } });
}
