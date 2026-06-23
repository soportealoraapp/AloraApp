'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionIntent, Match } from '@/lib/domain/types';
import { authFetch } from '@/lib/utils';
import { useSendLike } from './use-send-like';
import { createClient } from '@/lib/supabase/client';

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
    const [intent, setIntent] = useState<ConnectionIntent | undefined>(undefined);

    const { data: matchesData, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['matches', user?.id, intent],
        queryFn: async () => {
            const suffix = intent ? `?intent=${intent}` : '';
            const [matchesResponse, newMatchesResponse] = await Promise.all([
                authFetch(`/api/match/feed${suffix}`),
                authFetch(`/api/match/new${suffix}`),
            ]);
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
        staleTime: 15_000,
        placeholderData: (prev) => prev,
    });

    const matches = matchesData?.matches ?? [];
    const newMatches = matchesData?.newMatches ?? [];
    const error = queryError instanceof Error ? queryError.message : queryError ? 'Error desconocido' : null;

    // Realtime subscription for new matches — invalidates query on insert
    useEffect(() => {
        if (!user?.id) return;

        const supabase = createClient();
        const channel = supabase
            .channel(`matches:${user.id}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'matches' },
                (payload) => {
                    const match = payload.new as any;
                    if (match.user1Id === user.id || match.user2Id === user.id) {
                        queryClient.invalidateQueries({ queryKey: ['matches', user.id] });
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR') {
                    console.warn('[use-matches] Realtime channel error, will retry on next reconnect');
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
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
