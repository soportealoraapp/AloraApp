'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionIntent, Match } from '@/lib/domain/types';
import { authFetch } from '@/lib/utils';
import { useSendLike } from './use-send-like';
import { createClient } from '@/lib/supabase/client';
import { subscribeWithReconnect } from '@/lib/supabase/realtime-reconnect';

interface LikePreview {
    id: string;
    displayName: string;
    photoURL: string | null;
    type: string;
    intent: string;
    createdAt: Date;
}

export function useMatches() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const channelRef = useRef<any>(null);
    const [intent] = useState<ConnectionIntent | undefined>(undefined);

    const { data: matchesData, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['matches', user?.id, intent],
        queryFn: async () => {
            const suffix = intent ? `?intent=${intent}` : '';
            const [matchesResponse, newMatchesResponse] = await Promise.all([
                authFetch(`/api/match/feed${suffix}`),
                authFetch(`/api/match/new${suffix}`),
            ]);
            // Don't retry rate-limited requests — hammering the endpoint just
            // re-triggers the 429 and amplifies the problem.
            if (newMatchesResponse.status === 429 || matchesResponse.status === 429) {
                throw new Error('RATE_LIMITED');
            }
            if (!matchesResponse.ok || !newMatchesResponse.ok) {
                throw new Error('Error al cargar matches');
            }
            const [matches, newMatches] = await Promise.all([
                matchesResponse.json(),
                newMatchesResponse.json(),
            ]);
            return { matches: matches as Match[], newMatches: newMatches as LikePreview[] };
        },
        enabled: !!user?.id,
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: (failureCount, error) => {
            // Never retry rate-limit responses; otherwise allow a single retry.
            if (error instanceof Error && error.message === 'RATE_LIMITED') return false;
            return failureCount < 1;
        },
        placeholderData: (prev) => prev,
    });

    const matches = matchesData?.matches ?? [];
    const newMatches = matchesData?.newMatches ?? [];
    const error = queryError instanceof Error ? queryError.message : queryError ? 'Error desconocido' : null;

    // Realtime subscription for new matches and interactions — invalidates query on insert/update
    useEffect(() => {
        if (!user?.id) return;

        const supabase = createClient();
        const cleanups: (() => void)[] = [];

        // Listen for new matches AND match updates (unmatch, stage changes)
        const { channel: matchesChannel, cleanup: cleanupMatches } = subscribeWithReconnect(
            supabase,
            `matches:${user.id}`,
            (ch) =>
                ch.on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'matches' },
                    (payload) => {
                        const match = payload.new as any;
                        if (match.user1Id === user.id || match.user2Id === user.id) {
                            queryClient.invalidateQueries({ queryKey: ['matches', user.id] });
                        }
                    }
                ),
            { onStatusChange: (status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[use-matches] Realtime matches channel error, will retry on next reconnect');
                }
            }},
        );
        cleanups.push(cleanupMatches);

        // Listen for new incoming likes (someone liked me)
        const { cleanup: cleanupInteractions } = subscribeWithReconnect(
            supabase,
            `interactions:${user.id}`,
            (ch) =>
                ch.on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'interactions' },
                    (payload) => {
                        const interaction = payload.new as any;
                        if (interaction.toUserId === user.id && interaction.type !== 'pass') {
                            queryClient.invalidateQueries({ queryKey: ['matches', user.id] });
                        }
                    }
                ),
        );
        cleanups.push(cleanupInteractions);

        channelRef.current = matchesChannel;

        return () => {
            cleanups.forEach((fn) => fn());
        };
    }, [user?.id, queryClient]);

    const { sendLike: baseSendLike } = useSendLike(() => {
        queryClient.invalidateQueries({ queryKey: ['matches', user?.id] });
    });

    const sendLike = useCallback(async (
        toUserId: string,
        type: 'like' | 'superlike' | 'pass' = 'like',
        intentLike: ConnectionIntent = 'dating',
        showToast = true
    ) => {
        return baseSendLike(toUserId, type, intentLike, showToast);
    }, [baseSendLike]);

    return {
        matches,
        newMatches,
        loading,
        error,
        sendLike,
        refresh: () => queryClient.invalidateQueries({ queryKey: ['matches', user?.id] }),
    };
}
