export const photoAdvisor = {
    evaluatePhotoSet(photos: string[]): { score: number; suggestions: string[] } {
        const suggestions = [];
        let score = 0;

        if (photos.length >= 4) {
            score += 40;
        } else {
            suggestions.push("Sube al menos 4 fotos para aumentar tus matches un 30%.");
        }

        // Mock analysis of individual photos
        // In real app we would check resolution or face detection
        if (photos.length > 0) {
            score += 30; // First photo exists
        }

        // Random suggestion for realism in mock
        suggestions.push("Tu segunda foto tiene buena luz, considera ponerla de primera.");

        return {
            score: Math.min(100, score + 30), // Baseline
            suggestions
        };
    }
};
