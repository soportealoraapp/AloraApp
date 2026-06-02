'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteButtonProps {
    profileId: string;
    className?: string;
    size?: 'sm' | 'default' | 'lg';
}

export function FavoriteButton({ profileId, className, size = 'default' }: FavoriteButtonProps) {
    const [isFavorited, setIsFavorited] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetch(`/api/profile/favorites/check?profileId=${profileId}`)
            .then(r => r.json())
            .then(data => { setIsFavorited(data.isFavorited); })
            .catch(() => {});
    }, [profileId]);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (loading) return;

        setLoading(true);
        try {
            if (isFavorited) {
                await fetch(`/api/profile/favorites?profileId=${profileId}`, { method: 'DELETE' });
                setIsFavorited(false);
                toast({ title: 'Eliminado de favoritos' });
            } else {
                await fetch('/api/profile/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ profileId }),
                });
                setIsFavorited(true);
                toast({ title: 'Perfil guardado' });
            }
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size={size}
            variant="ghost"
            className={cn(
                "rounded-full",
                isFavorited ? "text-pink-500 hover:text-pink-600" : "text-muted-foreground hover:text-pink-500",
                className
            )}
            onClick={toggleFavorite}
            disabled={loading}
        >
            <Heart className={cn("h-5 w-5", isFavorited && "fill-current")} />
        </Button>
    );
}
