export interface VoiceEmotion {
    valence: number; // -1 to 1 (Negative to Positive)
    arousal: number; // 0 to 1 (Calm to Excited)
    primaryEmotion: 'joy' | 'sadness' | 'neutral' | 'curiosity' | 'enthusiasm';
    confidence: number;
}

export const voiceEmotionEngine = {
    detectEmotion(audioMetadata: { duration: number; loudness?: number }): VoiceEmotion {
        // Heuristic Mock:
        // Longer duration usually means more engagement (in positive contexts) or ranting (in negative).
        // Without real signal processing, we randomize for the demo based on "simulated" loudness.

        const randomValence = Math.random() * 2 - 1; // -1 to 1

        let primaryEmotion: VoiceEmotion['primaryEmotion'] = 'neutral';
        if (randomValence > 0.5) primaryEmotion = 'joy';
        else if (randomValence > 0.2) primaryEmotion = 'enthusiasm';
        else if (randomValence < -0.5) primaryEmotion = 'sadness';
        else if (randomValence > 0 && randomValence <= 0.2) primaryEmotion = 'curiosity';

        return {
            valence: parseFloat(randomValence.toFixed(2)),
            arousal: parseFloat(Math.random().toFixed(2)),
            primaryEmotion,
            confidence: 0.85
        };
    }
};
