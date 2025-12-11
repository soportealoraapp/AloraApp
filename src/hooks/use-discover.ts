'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types'; // Updated type // Actually keep old if needed or domain
import { getDynamicFeed } from '@/server/actions/feed';

interface DiscoverProfile {
    profile: UserProfile;
    compatibility: number;
    score?: any; // For the new AI score structure
}

export function useDiscover(searchTerm: string = '', limit: number = 20) {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            // DIRECT SERVER ACTION CALL
            // This bypasses the old API route effectively
            const feed = await getDynamicFeed(user.uid);

            // Map to expected structure (keeping compatibility field for backward compat)
            const mapped = feed.map(item => ({
                profile: item.profile,
                compatibility: item.score.components.baseCompatibility, // adapter
                score: item.score
            }));

            setProfiles(mapped);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Error cargando feed inteligente');
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const refresh = () => {
        fetchProfiles();
    };

    return {
        profiles,
        setProfiles, // added to allow optimistic updates
        loading,
        error,
        refresh,
    };
}
