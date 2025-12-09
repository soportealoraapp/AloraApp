'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/firebase/types';

export function useProfile(userId?: string) {
    const { user, profile: currentUserProfile } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchProfile() {
            // Si no hay userId, usar el perfil del usuario actual
            if (!userId) {
                setProfile(currentUserProfile);
                setLoading(false);
                return;
            }

            // Si el userId es el del usuario actual, usar el del context
            if (user && userId === user.uid) {
                setProfile(currentUserProfile);
                setLoading(false);
                return;
            }

            // Fetch otro perfil
            try {
                setLoading(true);
                const token = await user?.getIdToken();
                const response = await fetch(`/api/profile/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al cargar el perfil');
                }

                const data = await response.json();
                setProfile(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error desconocido');
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [userId, user, currentUserProfile]);

    const updateProfile = async (updates: Partial<UserProfile>) => {
        try {
            const token = await user?.getIdToken();
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el perfil');
            }

            const updatedProfile = await response.json();
            setProfile(updatedProfile);
            return updatedProfile;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
            throw err;
        }
    };

    return {
        profile,
        loading,
        error,
        updateProfile,
    };
}
