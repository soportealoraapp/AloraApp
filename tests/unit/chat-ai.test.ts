import { describe, it, expect } from 'vitest';
import { conversationObserver, toneMirror } from '@/ai/chat/conversation-observer';
import { icebreakerEngine } from '@/ai/chat/icebreaker-engine';

describe('Phase 7 Conversational AI', () => {
    it('Observer detects stale chat', () => {
        const staleDate = new Date();
        staleDate.setHours(staleDate.getHours() - 7); // 7 hours ago

        const status = conversationObserver.analyzeChat(staleDate, 10);
        expect(status.isStale).toBe(true);
        expect(status.healthScore).toBeLessThan(100);
    });

    it('Tone Mirror suggests warmth for short text', () => {
        const result = toneMirror.analyzeDraft("Hola");
        expect(result.tone).toBe('cold');
        expect(result.suggestion).toBeDefined();
    });

    it('Icebreaker Engine returns suggestions', () => {
        const mockUserA = { id: '1', name: 'A' } as any;
        const mockUserB = { id: '2', name: 'B' } as any;

        const suggestions = icebreakerEngine.generateIcebreakers(mockUserA, mockUserB);
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions.length).toBeLessThanOrEqual(5);
    });
});
