'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/firebase/types';

interface DiscoverProfile {
    profile: UserProfile;
    compatibility: number;
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
            const token = await user.getIdToken();

            const queryParams = new URLSearchParams();
            if (searchTerm) queryParams.set('search', searchTerm);
            queryParams.set('limit', limit.toString());

            const response = await fetch(`/api/discover?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar perfiles');
            }

            const data = await response.json();
            setProfiles(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            setProfiles([]);
        } finally {
            setLoading(false);
        }
    }, [user, searchTerm, limit]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const refresh = () => {
        fetchProfiles();
    };

    return {
        profiles,
        loading,
        error,
        refresh,
    };
}
