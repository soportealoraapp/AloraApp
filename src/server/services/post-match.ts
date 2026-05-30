import { prisma } from '@/lib/prisma';
import { generateIcebreakers } from '@/ai/copilot/icebreaker-ai';
import { calculateCompatibility } from '@/lib/compatibility/engine';

export interface PostMatchData {
    matchId: string;
    icebreakers: string[];
    questions: string[];
    sharedTopic: string;
    compatibilityScore: number;
}

/**
 * Generate post-match activation data for a new match.
 */
export async function generatePostMatchData(matchId: string): Promise<PostMatchData> {
    const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: {
            user1: { include: { profile: true } },
            user2: { include: { profile: true } },
        }
    });

    if (!match || !match.user1.profile || !match.user2.profile) {
        return {
            matchId,
            icebreakers: [],
            questions: [],
            sharedTopic: '',
            compatibilityScore: 0,
        };
    }

    const userA = match.user1;
    const userB = match.user2;
    const profileA = userA.profile!;
    const profileB = userB.profile!;

    // Generate icebreakers
    const icebreakers = await generateIcebreakers(
        {
            displayName: profileA.displayName || '',
            interests: profileA.interests,
            values: profileA.values,
            bio: profileA.bio || '',
            musicGenres: profileA.musicGenres || [],
        },
        {
            displayName: profileB.displayName || '',
            interests: profileB.interests,
            values: profileB.values,
            bio: profileB.bio || '',
            musicGenres: profileB.musicGenres || [],
        }
    );

    // Generate questions based on compatibility
    const questions = generateQuestions(profileA, profileB);

    // Find shared topic
    const sharedInterests = (profileA.interests || []).filter(i =>
        (profileB.interests || []).includes(i)
    );
    const sharedTopic = sharedInterests.length > 0
        ? `Les gusta ${sharedInterests[0]}`
        : findSharedTopic(profileA.bio || '', profileB.bio || '');

    // Get compatibility score
    const compatibility = await calculateCompatibility(userA.id, userB.id);

    // Track activation
    await prisma.analyticsEvent.create({
        data: {
            userId: userA.id,
            event: 'match_activation_generated',
            metadata: { matchId, icebreakersCount: icebreakers.length },
        }
    });

    return {
        matchId,
        icebreakers,
        questions,
        sharedTopic,
        compatibilityScore: compatibility.totalScore,
    };
}

/**
 * Generate personalized questions based on both profiles.
 */
function generateQuestions(profileA: any, profileB: any): string[] {
    const questions: string[] = [];

    // Based on shared interests
    const sharedInterests = (profileA.interests || []).filter((i: string) =>
        (profileB.interests || []).includes(i)
    );

    if (sharedInterests.includes('Música') || sharedInterests.includes('música')) {
        questions.push('¿Cuál fue el último concierto al que fuiste?');
    }

    if (sharedInterests.includes('Viajar') || sharedInterests.includes('viajes')) {
        questions.push('¿Cuál es tu destino soñado?');
    }

    if (sharedInterests.includes('Cine') || sharedInterests.includes('cine')) {
        questions.push('¿Cuál es la última película que te hizo llorar o reír mucho?');
    }

    if (sharedInterests.includes('Cocinar') || sharedInterests.includes('cocina')) {
        questions.push('¿Cuál es tu plato estrella para impresionar?');
    }

    // Based on values
    const sharedValues = (profileA.values || []).filter((v: string) =>
        (profileB.values || []).includes(v)
    );

    if (sharedValues.includes('Aventura')) {
        questions.push('¿Cuál es la aventura más loca que has vivido?');
    }

    if (sharedValues.includes('Familia')) {
        questions.push('¿Cómo es un domingo perfecto con tu familia?');
    }

    // Fallback questions
    if (questions.length < 3) {
        questions.push('¿Qué es lo que más te gusta de conocer gente nueva?');
        questions.push('¿Cómo te gusta pasar tus fines de semana?');
    }

    return questions.slice(0, 3);
}

/**
 * Find a shared topic from two bios.
 */
function findSharedTopic(bioA: string, bioB: string): string {
    const topics = [
        { keywords: ['música', 'cantar', 'concierto', 'guitarra'], label: 'la música' },
        { keywords: ['viajar', 'aventura', 'explorar', 'destino'], label: 'los viajes' },
        { keywords: ['cine', 'película', 'series', 'netflix'], label: 'el cine' },
        { keywords: ['comida', 'cocinar', 'restaurante', 'gastronomía'], label: 'la comida' },
        { keywords: ['deporte', 'gym', 'correr', 'yoga'], label: 'el deporte' },
        { keywords: ['lectura', 'libros', 'leer', 'escritura'], label: 'la lectura' },
        { keywords: ['familia', 'hijos', 'hermanos', 'padres'], label: 'la familia' },
        { keywords: ['mascota', 'perro', 'gato', 'animal'], label: 'las mascotas' },
    ];

    const lowerA = bioA.toLowerCase();
    const lowerB = bioB.toLowerCase();

    for (const topic of topics) {
        const aHas = topic.keywords.some(k => lowerA.includes(k));
        const bHas = topic.keywords.some(k => lowerB.includes(k));
        if (aHas && bHas) {
            return `Ambos hablan de ${topic.label}`;
        }
    }

    return 'Son compatibles según sus perfiles';
}
