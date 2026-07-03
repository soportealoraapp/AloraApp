import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;

interface ReconnectOptions {
    onStatusChange?: (status: string) => void;
    maxRetries?: number;
    baseDelay?: number;
}

export function subscribeWithReconnect(
    supabase: SupabaseClient,
    channelName: string,
    setup: (channel: ReturnType<SupabaseClient['channel']>) => ReturnType<SupabaseClient['channel']>,
    options: ReconnectOptions = {},
): { channel: RealtimeChannel; cleanup: () => void } {
    const maxRetries = options.maxRetries ?? MAX_RETRIES;
    const baseDelay = options.baseDelay ?? BASE_DELAY_MS;
    let retryCount = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let currentChannel: RealtimeChannel | null = null;
    let cleanedUp = false;

    function connect() {
        if (cleanedUp) return;

        const raw = supabase.channel(channelName);
        currentChannel = setup(raw).subscribe((status) => {
            options.onStatusChange?.(status);

            if (status === 'SUBSCRIBED') {
                retryCount = 0;
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                if (retryCount < maxRetries) {
                    const delay = baseDelay * Math.pow(2, retryCount);
                    retryCount++;
                    console.warn(`[realtime] ${channelName} ${status}, retry ${retryCount}/${maxRetries} in ${delay}ms`);
                    retryTimer = setTimeout(() => {
                        if (!cleanedUp) {
                            supabase.removeChannel(currentChannel!);
                            connect();
                        }
                    }, delay);
                } else {
                    console.warn(`[realtime] ${channelName} ${status}, max retries exhausted`);
                }
            }
        });
    }

    connect();

    function cleanup() {
        cleanedUp = true;
        if (retryTimer) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        if (currentChannel) {
            supabase.removeChannel(currentChannel);
            currentChannel = null;
        }
    }

    return { channel: currentChannel!, cleanup };
}
