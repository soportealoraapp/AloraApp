'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/domain/types';

export function useProfile(userId?: string) {
    const { user, profile: currentUserProfile } = useAuth();
    const queryClient = useQueryClient();

    const targetUserId = userId && typeof userId === 'string' && userId.trim() !== '' && userId !== 'undefined' && userId !== 'null'
        ? userId
        : undefined;

    const isValidId = !!targetUserId;
    const isSelf = user && targetUserId === user.id;
    const skipFetch = !isValidId || (isValidId && (!user || targetUserId === user.id));

    const { data: profile, isLoading: loading, error: queryError } = useQuery({
        queryKey: ['profile', targetUserId || user?.id],
        queryFn: async (): Promise<UserProfile | null> => {
            if (!isValidId) {
                if (targetUserId === 'undefined' || targetUserId === 'null') {
                    throw new Error('ID de usuario inválido');
                }
                return currentUserProfile;
            }
            if (isSelf) return currentUserProfile;

            const response = await fetch(`/api/profile/${targetUserId}`);
            if (!response.ok) throw new Error('Error al cargar el perfil');
            return response.json();
        },
        enabled: !!user,
        staleTime: 30_000,
        placeholderData: skipFetch ? currentUserProfile : undefined,
    });

    const error = queryError instanceof Error ? queryError.message : queryError ? 'Error desconocido' : null;

    const { mutateAsync: updateProfile } = useMutation({
        mutationFn: async (updates: Partial<UserProfile>) => {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            if (!response.ok) throw new Error('Error al actualizar el perfil');
            return response.json() as Promise<UserProfile>;
        },
        onSuccess: (updated) => {
            queryClient.setQueryData(['profile', user?.id], updated);
            if (targetUserId && targetUserId !== user?.id) {
                queryClient.setQueryData(['profile', targetUserId], updated);
            }
        },
    });

    return {
        profile: profile ?? null,
        loading,
        error,
        updateProfile,
    };
}
