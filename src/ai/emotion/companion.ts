export const emotionCompanion = {
    async getWeeklyInsight(userId: string): Promise<string> {
        // Mock analysis of user activity
        const randomNumber = Math.random();

        if (randomNumber > 0.7) {
            return "Tu energía de conversación fue muy positiva esta semana ✨. ¡Sigue así!";
        } else if (randomNumber > 0.4) {
            return "Has estado más activo por las noches. ¿Sabías que tus mejores matches ocurren en la mañana? ☀️";
        } else {
            return "Tu racha aumentó 3 días 🔥. La consistencia es clave para encontrar conexiones reales.";
        }
    },

    async getDailyPhrase(): Promise<string> {
        const phrases = [
            "La vulnerabilidad es la cuna de la conexión.",
            "Escucha para entender, no para responder.",
            "Tu autenticidad es tu mayor superpoder.",
            "Cada conexión comienza con un simple 'hola'."
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
};
