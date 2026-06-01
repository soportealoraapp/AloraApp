'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { PlusBadge } from '@/components/premium/PlusBadge';

interface Favorite {
    id: string;
    name: string;
    age: number;
    city: string;
    photo: string;
    isVerified: boolean;
    savedAt: string;
}

export default function FavoritesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetch('/api/profile/favorites')
            .then(r => r.json())
            .then(data => setFavorites(data.favorites || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const removeFavorite = async (profileId: string) => {
        try {
            await fetch(`/api/profile/favorites?profileId=${profileId}`, { method: 'DELETE' });
            setFavorites(prev => prev.filter(f => f.id !== profileId));
            toast({ title: 'Eliminado de favoritos' });
        } catch (error) {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Perfiles guardados</h1>
                        <PlusBadge label="Favoritos Plus" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {favorites.length} perfil{favorites.length !== 1 ? 'es' : ''} guardado{favorites.length !== 1 ? 's' : ''}
                        <span className="text-amber-600 ml-1">· Favoritos ilimitados con Plus</span>
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : favorites.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">No tienes perfiles guardados</p>
                        <p className="text-sm text-muted-foreground">Guarda perfiles que te interesen para verlos después</p>
                        <Button asChild className="mt-4">
                            <Link href="/discover">Explorar perfiles</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {favorites.map(fav => (
                        <Link key={fav.id} href={`/profile/${fav.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer group overflow-hidden">
                                <div className="relative h-48 overflow-hidden">
                                    <Image
                                        src={fav.photo}
                                        alt={fav.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform"
                                    />
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeFavorite(fav.id);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <CardContent className="p-3">
                                    <p className="font-bold text-sm">{fav.name}, {fav.age}</p>
                                    <p className="text-xs text-muted-foreground">{fav.city}</p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function Image({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) {
    return (
        <img
            src={src}
            alt={alt}
            className={cn("object-cover", fill && "absolute inset-0 w-full h-full", className)}
        />
    );
}

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}
