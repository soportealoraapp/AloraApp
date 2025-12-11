export const profileEnhancer = {
    suggestBio(interests: string[], values: string[]): string {
        // Mock GenAI: In real app, call OpenAI/Gemini
        const tone = "auténtico y divertido";
        return `Soy una persona apasionada por ${interests.join(', ')}. Valoro mucho ${values.join(' y ')}. Busco conectar de forma ${tone}.`;
    },

    analyzeProfileStrength(profile: any): number {
        let score = 50;
        if (profile.bio?.length > 50) score += 20;
        if (profile.photos?.length >= 3) score += 20;
        if (profile.interests?.length >= 5) score += 10;
        return Math.min(100, score);
    }
};
