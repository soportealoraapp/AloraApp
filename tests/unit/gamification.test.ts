import { describe, it, expect, vi } from 'vitest';
import { emotionCompanion } from '@/ai/emotion/companion';
import { photoAdvisor } from '@/ai/wingman/photo-advisor'; // From Phase 4 but relevant context
import { BADGE_DEFINITIONS } from '@/server/actions/badges';

describe('Phase 5 Gamification', () => {
    it('Emotion Companion returns daily phrase', async () => {
        const phrase = await emotionCompanion.getDailyPhrase();
        expect(phrase).toBeDefined();
        expect(phrase.length).toBeGreaterThan(10);
    });

    it('Emotion Companion returns insight', async () => {
        const insight = await emotionCompanion.getWeeklyInsight('user123');
        expect(insight).toBeDefined();
    });

    it('Badge Definitions exist', () => {
        expect(BADGE_DEFINITIONS.length).toBeGreaterThan(0);
        expect(BADGE_DEFINITIONS[0].key).toBe('warm_conversationalist');
    });
});
