import { UserProfile } from '@/lib/domain/types';

export interface ProfileInsights {
    personalitySummary: string;
    topAffinities: string[];
    seekingAnalysis: string;
    photoScore: number;
    bestActiveHours: string;
}

export const profileInsightsGenerator = {
    generateInsights(profile: UserProfile): ProfileInsights {
        // 1. Personality Summary (Heuristic from interests/values)
        const interests = profile.interests || [];
        const values = profile.values || [];

        let persona = "Balanceada";
        if (interests.some(i => ['Viajes', 'Aventura', 'Deporte'].includes(i))) persona = "Aventurera y Activa";
        else if (interests.some(i => ['Libros', 'Arte', 'Cine'].includes(i))) persona = "Creativa y Cultural";

        // 2. Seeking Analysis
        const seeking = profile.seeking === 'men' ? 'Hombres' : profile.seeking === 'women' ? 'Mujeres' : 'Todos';
        const intent = "una conexión auténtica"; // Placeholder could be derived from bio

        // 3. Photo Score (Mock - assuming we have metadata later)
        const photoScore = Math.min(100, (profile.photos.length * 20));

        return {
            personalitySummary: `${persona} con valores centrados en ${values.slice(0, 2).join(' y ')}.`,
            topAffinities: [...interests.slice(0, 3)],
            seekingAnalysis: `Busca ${seeking} para ${intent}.`,
            photoScore,
            bestActiveHours: "19:00 - 22:00" // Mock analytics
        };
    }
};
