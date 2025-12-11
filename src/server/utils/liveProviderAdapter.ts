// This adapter abstracts the live streaming provider.
// Initially mocks WebRTC signaling, but can be swapped for LiveKit/Agora.

export interface LiveRoomConfig {
    roomId: string;
    hostId: string;
    participants: string[];
    isRecording: boolean;
}

export const liveProvider = {
    async createRoom(config: LiveRoomConfig): Promise<{ token: string, wsUrl: string }> {
        // Mock provisioning a room
        console.log(`[LiveAdapter] Creating room ${config.roomId} for host ${config.hostId}`);
        return {
            token: `mock_token_${Date.now()}`,
            wsUrl: `wss://mock-signal.alora.app/v1/rooms/${config.roomId}`
        };
    },

    async endRoom(roomId: string) {
        console.log(`[LiveAdapter] Closing room ${roomId}`);
    }
};
