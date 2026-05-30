interface DimensionScores {
    values: number;
    relationshipGoals: number;
    personality: number;
    quizzes: number;
    interests: number;
    lifestyle: number;
}

interface ExplanationData {
    valuesA: string[];
    valuesB: string[];
    interestsA: string[];
    interestsB: string[];
    musicGenresA: string[];
    musicGenresB: string[];
    smokingA: string;
    smokingB: string;
    drinkingA: string;
    drinkingB: string;
    childrenA: string;
    childrenB: string;
    educationA: string;
    educationB: string;
}

/**
 * Generate human-readable Spanish explanations for compatibility.
 */
export function generateExplanations(
    scores: DimensionScores,
    data: ExplanationData
): string[] {
    const explanations: string[] = [];

    // Values explanations (highest weight)
    if (scores.values >= 70) {
        const shared = data.valuesA.filter(v => data.valuesB.includes(v));
        if (shared.length > 0) {
            explanations.push(`Comparten valores como ${shared.slice(0, 3).join(', ')}`);
        } else {
            explanations.push('Tienen valores compatibles aunque expresados de forma diferente');
        }
    } else if (scores.values < 40) {
        explanations.push('Sus valores principales difieren significativamente');
    }

    // Relationship goals
    if (scores.relationshipGoals >= 70) {
        explanations.push('Ambos buscan un tipo de relación similar');
    } else if (scores.relationshipGoals < 40) {
        explanations.push('Sus objetivos de relación no coinciden完全amente');
    }

    // Interests
    if (scores.interests >= 70) {
        const shared = data.interestsA.filter(i => data.interestsB.includes(i));
        if (shared.length > 0) {
            explanations.push(`Les interesan temas como ${shared.slice(0, 3).join(', ')}`);
        }
    } else if (scores.interests >= 50) {
        explanations.push('Comparten algunos intereses en común');
    }

    // Lifestyle
    if (scores.lifestyle >= 70) {
        const lifestyleMatches: string[] = [];
        if (data.smokingA === data.smokingB && data.smokingA) {
            lifestyleMatches.push('fumar');
        }
        if (data.drinkingA === data.drinkingB && data.drinkingA) {
            lifestyleMatches.push('beber');
        }
        if (data.childrenA === data.childrenB && data.childrenA) {
            lifestyleMatches.push('hijos');
        }
        if (lifestyleMatches.length > 0) {
            explanations.push(`Coinciden en ${lifestyleMatches.join(', ')}`);
        } else {
            explanations.push('Su estilo de vida es compatible');
        }
    }

    // Music
    if (data.musicGenresA.length > 0 && data.musicGenresB.length > 0) {
        const sharedMusic = data.musicGenresA.filter(m => data.musicGenresB.includes(m));
        if (sharedMusic.length > 0) {
            explanations.push(`Disfrutan de ${sharedMusic.slice(0, 2).join(' y ')}`);
        }
    }

    // Personality
    if (scores.personality >= 70) {
        explanations.push('Sus personalidades se complementan bien');
    } else if (scores.personality < 40) {
        explanations.push('Sus personalidades pueden generar fricción');
    }

    // Quizzes
    if (scores.quizzes >= 70) {
        explanations.push('Los quizzes confirman alta compatibilidad');
    }

    // Ensure at least 2 explanations
    if (explanations.length === 0) {
        explanations.push('Aún necesitan conocerse mejor');
    }
    if (explanations.length === 1) {
        explanations.push('Hay potencial para una conexión genuina');
    }

    return explanations.slice(0, 5);
}
