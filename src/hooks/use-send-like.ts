'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ConnectionIntent } from '@/lib/domain/types';
import { useToast } from './use-toast';
import { authFetch } from '@/lib/utils';

export function useSendLike(onMatchCreated?: (intent: ConnectionIntent) => void) {
    const { user } = useAuth();
    const { toast } = useToast();

    const sendLike = useCallback(async (
        toUserId: string,
        type: 'like' | 'superlike' | 'pass' = 'like',
        intent: ConnectionIntent = 'dating',
        showToast: boolean = true
    ) => {
        if (!user) return;

        try {
            const response = await authFetch('/api/match/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId, type, intent }),
            });

            if (!response.ok) {
                throw new Error('Error al enviar like');
            }

            const result = await response.json();

            if (result.matched) {
                if (showToast) {
                    const isFriendship = intent === 'friendship';
                    toast({
                        title: isFriendship ? '¡Nueva amistad! 🤝' : '¡Nuevo match! 🎉',
                        description: isFriendship ? 'Ahora pueden conocerse como amigos.' : 'Ahora puedes chatear.',
                    });
                }
                onMatchCreated?.(intent);
            } else if (showToast && type !== 'pass') {
                toast({
                    title: type === 'superlike' ? '¡Flechado enviado! ✨' : 'Like enviado ❤️',
                    description: '¡Ojalá hagan match!',
                });
            }

            return result;
        } catch (err) {
            if (showToast) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo enviar el like',
                });
            }
            throw err;
        }
    }, [user, toast, onMatchCreated]);

    return { sendLike };
}
