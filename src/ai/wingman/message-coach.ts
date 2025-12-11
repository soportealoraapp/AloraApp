export const messageCoach = {
    suggestOpener(targetInterests: string[]): string {
        if (targetInterests.length === 0) return "Hola, tu perfil me pareció muy interesante. ¿Qué tal tu día?";
        const interest = targetInterests[Math.floor(Math.random() * targetInterests.length)];
        return `¡Hola! Vi que te gusta ${interest}. ¿Cuál es tu experiencia favorita con eso?`;
    },

    evaluateDraft(text: string): string {
        if (text.length < 5) return "Un poco corto. Intenta preguntar algo abierto.";
        if (text.includes("hola")) return "Es un buen inicio, pero intenta mencionar algo de su perfil.";
        return "¡Se ve bien! Tono amable y directo.";
    }
};
