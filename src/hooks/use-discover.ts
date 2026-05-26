'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types';
import { getDynamicFeed, FeedItem } from '@/server/actions/feed';

interface DiscoverProfile {
    profile: UserProfile;
    compatibility: number;
    score?: any;
}

export function useDiscover(searchTerm: string = '', limit: number = 10) {
    const { user } = useAuth();
    const [profilesData, setProfilesData] = useState<DiscoverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const cursorRef = useRef<string | null>(null);
    const hasMoreRef = useRef(true);

    const fetchProfiles = useCallback(async (isRefresh = false) => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            if (isRefresh) {
                setLoading(true);
                cursorRef.current = null;
                hasMoreRef.current = true;
            }

            const result = await getDynamicFeed(
                user.id,
                searchTerm || undefined,
                isRefresh ? undefined : cursorRef.current || undefined,
                limit
            );

            cursorRef.current = result.nextCursor;
            hasMoreRef.current = result.hasMore;

            const mapped: DiscoverProfile[] = result.items.map(item => ({
                profile: {
                    ...item.profile,
                    activeNow: item.signals?.activeNow,
                    highResponseRate: item.signals?.highResponseRate,
                    sharedInterests: item.signals?.sharedInterests,
                    messageResponseRate: item.signals?.messageResponseRate,
                    lastActiveHours: item.signals?.lastActiveHours,
                },
                compatibility: item.score?.details?.quizCompatibility || item.score?.total || 0,
                score: item.score,
            }));

            if (isRefresh || !cursorRef.current) {
                setProfilesData(mapped);
            } else {
                setProfilesData(prev => [...prev, ...mapped]);
            }

            setError(null);
        } catch (err) {
            console.error('Discover fetch error:', err);
            setError('No pudimos cargar nuevos perfiles. Verifica tu conexión.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [user?.id, searchTerm, limit]);

    useEffect(() => {
        fetchProfiles(true);
    }, [fetchProfiles, retryCount]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMoreRef.current) return;
        setLoadingMore(true);
        fetchProfiles(false);
    }, [loadingMore, fetchProfiles]);

    const refresh = useCallback(() => {
        setRetryCount(prev => prev + 1);
    }, []);

    return {
        profiles: profilesData,
        setProfiles: setProfilesData,
        loading,
        loadingMore,
        error,
        refresh,
        loadMore,
        hasMore: hasMoreRef.current,
    };
}
