export interface VoiceEmotion {
    valence: number; // -1 to 1 (Negative to Positive)
    arousal: number; // 0 to 1 (Calm to Excited)
    primaryEmotion: 'joy' | 'sadness' | 'neutral' | 'curiosity' | 'enthusiasm';
    confidence: number;
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

export const voiceEmotionEngine = {
    detectEmotion(audioMetadata: { duration: number; loudness?: number }): VoiceEmotion {
        const { duration, loudness } = audioMetadata;

        // Duration signal: very short (<3s) tends neutral; moderate (3-15s) signals engagement;
        // very long (>30s) can indicate excitement or frustration depending on loudness.
        const durationNorm = clamp((duration - 3) / 27, 0, 1); // 0 at 3s, 1 at 30s

        // Loudness signal: quiet tends calm, loud tends excited/enthusiastic
        const loudnessNorm = loudness != null ? clamp(loudness / 100, 0, 1) : 0.5;

        // Valence heuristic: moderate duration + moderate loudness = positive;
        // very loud + long = potentially negative (ranting); quiet + short = neutral/sad
        let valence: number;
        if (duration < 3) {
            // Very short utterances lean neutral
            valence = 0.1 * loudnessNorm;
        } else if (duration > 30 && loudnessNorm > 0.7) {
            // Long + loud = likely venting/frustration
            valence = -0.3 - (durationNorm * 0.3);
        } else if (durationNorm > 0.3 && loudnessNorm > 0.4 && loudnessNorm < 0.8) {
            // Engaged, moderate energy = positive
            valence = 0.3 + (durationNorm * 0.4);
        } else {
            valence = durationNorm * 0.3 - 0.1;
        }

        valence = clamp(valence, -1, 1);

        // Arousal heuristic: primarily driven by loudness, boosted by duration
        const arousal = clamp(loudnessNorm * 0.7 + durationNorm * 0.3, 0, 1);

        // Classify primary emotion from valence + arousal
        let primaryEmotion: VoiceEmotion['primaryEmotion'] = 'neutral';
        if (valence > 0.5 && arousal > 0.5) {
            primaryEmotion = 'enthusiasm';
        } else if (valence > 0.3) {
            primaryEmotion = 'joy';
        } else if (valence < -0.3) {
            primaryEmotion = 'sadness';
        } else if (valence >= 0 && valence <= 0.2 && durationNorm > 0.2) {
            primaryEmotion = 'curiosity';
        }

        // Confidence: higher when signals are strong (loudness and duration provide clear data)
        const confidence = clamp(0.5 + loudnessNorm * 0.25 + Math.abs(valence) * 0.25, 0, 1);

        return {
            valence: parseFloat(valence.toFixed(2)),
            arousal: parseFloat(arousal.toFixed(2)),
            primaryEmotion,
            confidence: parseFloat(confidence.toFixed(2)),
        };
    }
};
