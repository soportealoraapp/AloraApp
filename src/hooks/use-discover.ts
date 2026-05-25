'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types';
import { getDynamicFeed } from '@/server/actions/feed';

interface DiscoverProfile {
    profile: UserProfile;
    compatibility: number;
    score?: any;
}

export function useDiscover(searchTerm: string = '', limit: number = 20) {
    const { user } = useAuth();
    const [profilesData, setProfilesData] = useState<DiscoverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const fetchProfiles = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const feed = await getDynamicFeed(user.id, searchTerm || undefined);

            const mapped = feed.map(item => ({
                profile: item.profile,
                compatibility: item.score?.details?.quizCompatibility || item.score?.total || 0,
                score: item.score
            }));

            setProfilesData(mapped);
            setError(null);
        } catch (err) {
            console.error('Discover fetch error:', err);
            setError('No pudimos cargar nuevos perfiles. Verifica tu conexión.');
            // Silent retry could be implemented here or manual
        } finally {
            setLoading(false);
        }
    }, [user?.id]); // Only depend on id

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles, retryCount]);

    const memoizedProfiles = useMemo(() => {
        if (!searchTerm) return profilesData;
        return profilesData.filter(p =>
            (p.profile.displayName || p.profile.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [profilesData, searchTerm]);

    const refresh = () => {
        setRetryCount(prev => prev + 1);
    };

    return {
        profiles: memoizedProfiles,
        setProfiles: setProfilesData,
        loading,
        error,
        refresh,
    };
}
