import { UserProfile } from '@/lib/domain/types';

export const icebreakerEngine = {
    generateIcebreakers(userA: UserProfile, userB: UserProfile, limit: number = 5): string[] {
        const icebreakers: string[] = [];

        // 1. Check Shared Interests (Mocking logic as if interests array existed on UserProfile, 
        // or using Seeking/Gender for very basic fallback if data missing)
        // In a real app we would intersect userA.interests and userB.interests

        // Mocking some common themes based on implicit data
        icebreakers.push("Noté que ambos están activos de noche. ¿Son del tipo Night Owl o solo insomnio creativo? 🦉");
        icebreakers.push("Basado en su energía social, parece que disfrutarían de una charla tranquila. ¿Café o vino?");

        // 2. Deep Questions (Random selection)
        const deepQuestions = [
            "¿Cuál es el recuerdo más feliz que tienes de este año?",
            "Si pudieras teletransportarte ahora mismo, ¿a dónde irías?",
            "¿Qué libro o película cambió tu forma de ver el mundo?",
            "¿Cuál es tu lugar favorito para relajarte cuando necesitas paz?"
        ];
        icebreakers.push(deepQuestions[Math.floor(Math.random() * deepQuestions.length)]);

        // 3. Fun/Silly
        icebreakers.push("Pregunta seria: ¿La pizza con piña es un crimen o un manjar? 🍕");

        // 4. Activity Based
        icebreakers.push("Si planearan la cita ideal de domingo, ¿incluiría aventura o sofá?");

        return icebreakers.slice(0, limit);
    }
};
