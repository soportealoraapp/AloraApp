import { COMPATIBILITY_QUIZZES } from '@/data/quizzes-data';
import { Quiz, QuizQuestion, ArchetypeInfo } from '@/types/compatibility';

export type { Quiz, QuizQuestion, ArchetypeInfo };

export { COMPATIBILITY_QUIZZES };

/**
 * Calculate quiz score from answers
 */
export function calculateQuizScore(quizId: string, answers: Record<string, string>): number {
    const quiz = COMPATIBILITY_QUIZZES.find(q => q.id === quizId);
    if (!quiz) return 0;

    let total = 0;
    let maxPossible = 0;

    for (const question of quiz.questions) {
        const answerId = answers[question.id];
        const option = question.options?.find(o => o.id === answerId);
        if (option) {
            total += option.score;
        }
        maxPossible += 10;
    }

    return maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
}

/**
 * Determine archetype based on quiz score
 */
export function determineArchetype(quizId: string, score: number): string {
    if (score >= 80) return 'profundo';
    if (score >= 60) return 'equilibrado';
    if (score >= 40) return 'social';
    return 'explorador';
}

export const ARCHETYPES: Record<string, ArchetypeInfo> = {
    profundo: {
        name: 'Profundo',
        description: 'Buscas conexiones significativas y valoras la profundidad emocional sobre la superficialidad. Para ti, una buena relación se construye sobre la confianza y la vulnerabilidad mutua.',
        strengths: ['Empático', 'Introspectivo', 'Leal', 'Observador'],
        risks: ['Puede ser demasiado intenso al inicio', 'Toma tiempo en abrirse', 'Evita la superficialidad'],
        idealPartner: ['Equilibrado', 'Social'],
        perception: 'Tu círculo te describe como alguien en quien se puede confiar. Profundo, serio cuando importa, pero con un humor sutil que solo conocen los cercanos.',
    },
    equilibrado: {
        name: 'Equilibrado',
        description: 'Tienes una mezcla sana de profundidad y diversión. Te adaptas a diferentes situaciones y personas, y valoras tanto la estabilidad como la espontaneidad.',
        strengths: ['Adaptable', 'Estable', 'Buen comunicador', 'Paciente'],
        risks: ['Puede parecer indeciso', 'A veces evita conflictos', 'Puede sacrificar sus necesidades'],
        idealPartner: ['Profundo', 'Explorador'],
        perception: 'Eres la persona que todos quieren en su grupo. Equilibrado, confiable, siempre con la actitud correcta. Un roble flexible.',
    },
    social: {
        name: 'Social',
        description: 'Energías altas, amas la gente y las experiencias compartidas. Las mejores memorias de tu vida son con otros.',
        strengths: ['Carismático', 'Empático', 'Espontáneo', 'Optimista'],
        risks: ['Puede aburrirse de rutinas', 'A veces habla más de lo que escucha', 'Necesita estímulo constante'],
        idealPartner: ['Profundo', 'Equilibrado'],
        perception: 'Eres la vida de la fiesta, pero también el amigo que llama solo para ver cómo estás. Social y genuino.',
    },
    explorador: {
        name: 'Explorador',
        description: 'Curioso por naturaleza, siempre buscando nuevas experiencias, ideas y personas que expandan tu mundo.',
        strengths: ['Curioso', 'Flexible', 'Creativo', 'Independiente'],
        risks: ['Evita compromisos rápidos', 'Puede aburrirse de rutinas', 'Difícil de conocer profundamente'],
        idealPartner: ['Equilibrado', 'Profundo'],
        perception: 'Siempre tienes una historia que contar. Explorador de vida, curioso de mente, libre de espíritu.',
    },
};
