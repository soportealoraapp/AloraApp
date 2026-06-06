'use server';

import { prisma } from '@/lib/prisma';

export interface DatePrepSuggestion {
    category: 'topics' | 'shared_interests' | 'avoid' | 'pacing' | 'listening_tips' | 'date_ideas';
    priority: number;
    content: string;
}

export interface PostDateReflection {
    id?: string;
    emotionalSafety: number;   // 1-5
    chemistry: number;         // 1-5
    authenticity: number;      // 1-5
    communication: number;     // 1-5
    wouldSeeAgain: boolean;
    notes?: string;
    createdAt?: Date;
}

export interface AiDateAnalysis {
    perceivedCompatibility: number;   // 0-100
    emotionalConsistency: number;     // 0-100
    possibleRedFlags: string[];
    longTermPotential: number;        // 0-100
    adviceForNextDate: string[];
}

export async function getDatePrep(
    userId: string,
    targetUserId: string,
): Promise<DatePrepSuggestion[]> {
    const [userProfile, targetProfile] = await Promise.all([
        prisma.profile.findUnique({ where: { userId } }),
        prisma.profile.findUnique({ where: { userId: targetUserId } }),
    ]);

    if (!userProfile || !targetProfile) return [];

    const suggestions: DatePrepSuggestion[] = [];

    // 1. Safe conversation topics
    const sharedInterests = (userProfile.interests || []).filter(i =>
        (targetProfile.interests || []).some(ti => ti.toLowerCase() === i.toLowerCase())
    );

    if (sharedInterests.length > 0) {
        suggestions.push({
            category: 'shared_interests',
            priority: 1,
            content: `Hablar sobre ${sharedInterests.slice(0, 3).join(', ')} es un excelente punto de partida. Son temas que ya sabes que les interesan a ambos.`,
        });
    }

    // 2. General conversation topics from bio
    const bioTopics = extractTopicsFromBio(targetProfile.bio || '');
    if (bioTopics.length > 0) {
        const topic = bioTopics[0];
        suggestions.push({
            category: 'topics',
            priority: 2,
            content: `${topic.charAt(0).toUpperCase() + topic.slice(1)} parece ser importante para ellx. Preguntarle al respecto puede mostrar interés genuino.`,
        });
    }

    // 3. Things to avoid
    const sensitiveSignals = detectSensitiveTopics(targetProfile);
    if (sensitiveSignals.length > 0) {
        suggestions.push({
            category: 'avoid',
            priority: 3,
            content: `Es mejor evitar temas como ${sensitiveSignals.slice(0, 2).join(' o ')} en las primeras conversaciones.`,
        });
    }

    // 4. Emotional pacing
    suggestions.push({
        category: 'pacing',
        priority: 4,
        content: 'No hay prisa. Deja que la conversación fluya de forma natural. Las mejores conexiones no se fuerzan.',
    });

    // 5. Listening tips
    suggestions.push({
        category: 'listening_tips',
        priority: 5,
        content: 'Escucha más de lo que hablas. Haz preguntas que inviten a ellx a compartir. El interés genuino se nota.',
    });

    // 6. Date ideas
    const dateIdeas = generateDateIdeas(sharedInterests, userProfile, targetProfile);
    suggestions.push(...dateIdeas.map((idea, i) => ({
        category: 'date_ideas' as const,
        priority: 6 + i,
        content: idea,
    })));

    return suggestions.sort((a, b) => a.priority - b.priority);
}

function extractTopicsFromBio(bio: string): string[] {
    const topics: string[] = [];
    const lower = bio.toLowerCase();

    const topicPatterns: { words: string[]; topic: string }[] = [
        { words: ['viaje', 'viajar', 'aventura', 'explorar'], topic: 'viajes' },
        { words: ['música', 'cantar', 'concierto', 'banda'], topic: 'música' },
        { words: ['arte', 'pintar', 'dibujar', 'museo'], topic: 'arte' },
        { words: ['cocina', 'cocinar', 'comida', 'gastronomía'], topic: 'gastronomía' },
        { words: ['libro', 'leer', 'escritura', 'poesía'], topic: 'lectura' },
        { words: ['deporte', 'yoga', 'gym', 'running', 'senderismo'], topic: 'actividad física' },
        { words: ['perro', 'gato', 'mascota', 'animal'], topic: 'mascotas' },
        { words: ['naturaleza', 'playa', 'montaña', 'campo'], topic: 'naturaleza' },
        { words: ['cine', 'series', 'película', 'documental'], topic: 'cine y series' },
        { words: ['fotos', 'fotografía', 'cámara'], topic: 'fotografía' },
    ];

    for (const tp of topicPatterns) {
        if (tp.words.some(w => lower.includes(w))) {
            topics.push(tp.topic);
        }
    }

    return topics;
}

function detectSensitiveTopics(profile: any): string[] {
    const signals: string[] = [];
    const bio = (profile.bio || '').toLowerCase();
    const values = (profile.values || []) as string[];

    if (values.some(v => ['religión', 'fe', 'espiritualidad'].includes(v.toLowerCase())) &&
        !values.some(v => ['libertad', 'mente abierta'].includes(v.toLowerCase()))) {
        signals.push('religión');
    }

    if (bio.includes('política') || values.some(v => v.toLowerCase() === 'política')) {
        signals.push('política');
    }

    if (values.some(v => ['tradición', 'familia', 'hijos'].includes(v.toLowerCase()))) {
        // Not necessarily sensitive, but worth noting
    }

    return signals;
}

function generateDateIdeas(sharedInterests: string[], userProfile: any, targetProfile: any): string[] {
    const ideas: string[] = [];

    if (sharedInterests.length > 0) {
        for (const interest of sharedInterests.slice(0, 2)) {
            switch (interest.toLowerCase()) {
                case 'café':
                case 'cafetería':
                    ideas.push('Un café en un lugar con buena conversación. Simple y efectivo.');
                    break;
                case 'naturaleza':
                case 'senderismo':
                    ideas.push('Una caminata al aire libre. Bueno para conversar sin presión.');
                    break;
                case 'museo':
                case 'arte':
                    ideas.push('Visitar un museo o galería. Da temas de conversación natural.');
                    break;
                case 'cocina':
                case 'gastronomía':
                    ideas.push('Cocinar juntos. Es divertido, colaborativo y relajado.');
                    break;
                case 'música':
                    ideas.push('Un concierto o sesión de música en vivo. La música conecta.');
                    break;
                case 'cine':
                    ideas.push('Ver una película y luego conversar sobre ella.');
                    break;
                default:
                    ideas.push(`Hacer algo relacionado con ${interest}. Es algo que sabes que le gusta.`);
            }
        }
    } else {
        ideas.push('Un café o bebida en un lugar tranquilo. Ideal para conocerse sin distracciones.');
        ideas.push('Una caminata por un lugar bonito de la ciudad. Conversación fluye mejor en movimiento.');
    }

    ideas.push('Lo más importante no es el plan, sino la actitud. Autenticidad y respeto siempre ganan.');

    return ideas;
}

export async function saveReflection(
    userId: string,
    data: PostDateReflection,
    matchId?: string,
    targetUserId?: string,
): Promise<string> {
    const saved = await prisma.dateReflection.create({
        data: {
            userId,
            targetUserId,
            matchId,
            emotionalSafety: data.emotionalSafety,
            chemistry: data.chemistry,
            authenticity: data.authenticity,
            communication: data.communication,
            wouldSeeAgain: data.wouldSeeAgain,
            notes: data.notes,
        },
    });

    return saved.id;
}

export async function analyzeReflection(
    reflection: PostDateReflection,
): Promise<AiDateAnalysis> {
    const perceivedCompatibility = Math.round(
        (reflection.chemistry * 0.3 +
            reflection.communication * 0.3 +
            reflection.authenticity * 0.2 +
            reflection.emotionalSafety * 0.2) / 5 * 100
    );

    const emotionalConsistency = Math.round(
        (reflection.authenticity + reflection.emotionalSafety) / 10 * 100
    );

    const possibleRedFlags: string[] = [];
    if (reflection.emotionalSafety < 3) {
        possibleRedFlags.push('La seguridad emocional fue baja. Es importante sentirse seguro con alguien.');
    }
    if (reflection.authenticity < 3) {
        possibleRedFlags.push('La autenticidad fue baja. Tal vez no se sintió cómodx siendo ellx mismx.');
    }
    if (reflection.chemistry >= 4 && reflection.emotionalSafety < 3) {
        possibleRedFlags.push('Mucha química pero poca seguridad. A veces la atracción intensa puede ser una señal de alerta.');
    }

    const longTermPotential = Math.round(
        (perceivedCompatibility * 0.4 +
            (reflection.wouldSeeAgain ? 100 : 20) * 0.3 +
            (1 - possibleRedFlags.length * 0.1) * 100 * 0.3)
    );

    const adviceForNextDate: string[] = [];
    if (possibleRedFlags.length === 0 && perceivedCompatibility > 60) {
        adviceForNextDate.push('Parece que fue una buena experiencia. Tómate el tiempo para procesar cómo te sientes.');
        adviceForNextDate.push('Si hay interés mutuo, un segundo encuentro puede ayudar a confirmar la conexión.');
    }
    if (reflection.emotionalSafety >= 4 && reflection.chemistry < 3) {
        adviceForNextDate.push('La seguridad estuvo ahí, pero la química puede necesitar más tiempo. A veces la conexión tarda en florecer.');
    }
    if (possibleRedFlags.length > 0) {
        adviceForNextDate.push('Confía en tus instintos. Si algo no se sintió bien, está bien tomarlo con calma.');
    }
    adviceForNextDate.push('No hay prisa. Las conexiones más significativas suelen construirse con el tiempo.');

    return {
        perceivedCompatibility,
        emotionalConsistency,
        possibleRedFlags,
        longTermPotential,
        adviceForNextDate,
    };
}

export async function getReflectionHistory(userId: string): Promise<(PostDateReflection & { aiAnalysis?: AiDateAnalysis })[]> {
    const reflections = await prisma.dateReflection.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
    });

    return reflections.map(r => ({
        emotionalSafety: r.emotionalSafety,
        chemistry: r.chemistry,
        authenticity: r.authenticity,
        communication: r.communication,
        wouldSeeAgain: r.wouldSeeAgain,
        notes: r.notes || undefined,
        createdAt: r.createdAt,
    }));
}
