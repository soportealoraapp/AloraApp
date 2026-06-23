'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types';
import { getDynamicFeed, FeedItem, FeedFilters } from '@/server/actions/feed';

export interface DiscoverProfile {
    profile: UserProfile;
    compatibility: number | null;
    score?: any;
}

export function useDiscover(searchTerm = '', filters?: FeedFilters, limit = 10) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const prevFiltersRef = useRef(filters);
    const [filterVersion, setFilterVersion] = useState(0);

    useEffect(() => {
        const prev = prevFiltersRef.current;
        const curr = filters;
        if (JSON.stringify(prev) !== JSON.stringify(curr)) {
            prevFiltersRef.current = curr;
            if (prev !== undefined) {
                setFilterVersion(v => v + 1);
            }
        }
    }, [filters]);

    const {
        data,
        isLoading: loading,
        isFetchingNextPage: loadingMore,
        hasNextPage: hasMore,
        fetchNextPage: loadMore,
        error: queryError,
        refetch,
    } = useInfiniteQuery({
        queryKey: ['discover', user?.id, searchTerm, filterVersion],
        queryFn: async ({ pageParam }) => {
            const result = await getDynamicFeed(
                user!.id,
                searchTerm || undefined,
                pageParam as string | undefined,
                limit,
                filters
            );

            const mapped: DiscoverProfile[] = (result?.items ?? []).map(item => ({
                profile: {
                    ...item.profile,
                    activeNow: item.signals?.activeNow,
                    highResponseRate: item.signals?.highResponseRate,
                    sharedInterests: item.signals?.sharedInterests,
                    messageResponseRate: item.signals?.messageResponseRate,
                    lastActiveHours: item.signals?.lastActiveHours,
                } as UserProfile,
                compatibility: (() => {
                    const realCompatibility = item.score?.details?.quizzes;
                    const totalScore = item.score?.total;
                    return typeof realCompatibility === 'number'
                        ? realCompatibility
                        : typeof totalScore === 'number'
                            ? totalScore
                            : null;
                })(),
                score: item.score,
            }));

            return {
                profiles: mapped,
                nextCursor: result?.nextCursor ?? null,
                hasMore: result?.hasMore ?? false,
            };
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.nextCursor : undefined,
        enabled: !!user?.id,
        staleTime: 60_000,
        gcTime: 5 * 60_000,
    });

    const profiles: DiscoverProfile[] = data?.pages.flatMap(p => p.profiles) ?? [];
    const error = queryError instanceof Error ? queryError.message : queryError ? 'No pudimos cargar nuevos perfiles. Verifica tu conexión.' : null;

    const refresh = useCallback(() => {
        refetch();
    }, [refetch]);

    const setProfiles = useCallback((updater: DiscoverProfile[] | ((prev: DiscoverProfile[]) => DiscoverProfile[])) => {
        queryClient.setQueryData(
            ['discover', user?.id, searchTerm, filterVersion],
            (old: any) => {
                if (!old) return old;
                const newFirstPage = typeof updater === 'function'
                    ? updater(old.pages[0].profiles)
                    : updater;
                return {
                    ...old,
                    pages: [{ ...old.pages[0], profiles: newFirstPage }, ...old.pages.slice(1)],
                };
            }
        );
    }, [queryClient, user?.id, searchTerm, filterVersion]);

    return {
        profiles,
        setProfiles,
        loading,
        loadingMore,
        error,
        refresh,
        loadMore,
        hasMore,
    };
}
