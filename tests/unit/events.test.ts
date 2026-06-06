import { describe, it, expect } from 'vitest';
import { liveProvider } from '@/server/utils/liveProviderAdapter';

describe('Live Provider Adapter', () => {
    it('Live Adapter creates room token', async () => {
        const room = await liveProvider.createRoom({
            roomId: 'test_room',
            hostId: 'host_1',
            participants: [],
            isRecording: false
        });
        expect(room.token).toBeDefined();
        expect(room.wsUrl).toContain('wss://');
    });

    // Mocking stories actions generally requires mocking DB, so skipping DB-dependent logic
    // in this lightweight unit test, focusing on adapters/logic.
});
