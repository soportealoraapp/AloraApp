import { describe, it, expect } from 'vitest';
import { transcriptionService } from '@/audio/transcription/transcribe';
import { voiceEmotionEngine } from '@/audio/emotion/detectEmotion';

describe('Phase 8 Audio Intelligence', () => {
    it('Emotion Engine detects arousal and valence', () => {
        const emotion = voiceEmotionEngine.detectEmotion({ duration: 10 });
        expect(emotion.valence).toBeGreaterThanOrEqual(-1);
        expect(emotion.valence).toBeLessThanOrEqual(1);
        expect(emotion.primaryEmotion).toBeDefined();
    });

    it('Transcription Service returns text (mock)', async () => {
        const result = await transcriptionService.transcribeAudio('http://mock.url/audio.webm');
        expect(result.text).toContain('Hola');
        expect(result.confidence).toBeGreaterThan(0.9);
    });
});
