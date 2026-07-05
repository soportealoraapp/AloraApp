'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, Trash2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SafeImage } from "@/components/ui/safe-image";
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
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const controller = new AbortController();
        fetch('/api/profile/favorites', { signal: controller.signal })
            .then(r => r.json())
            .then(data => setFavorites(data.favorites || []))
            .catch((err) => { if (err.name !== 'AbortError') { console.error(err); setError('Error al cargar los favoritos.'); } })
            .finally(() => setLoading(false));
        return () => controller.abort();
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
        <div className="bg-background min-h-dvh">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold md:text-2xl font-headline">Perfiles guardados</h1>
                        <PlusBadge label="Favoritos Plus" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {favorites.length} perfil{favorites.length !== 1 ? 'es' : ''} guardado{favorites.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </header>
            <main className="p-6 space-y-6">
            {error && favorites.length === 0 && (
                <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Reintentar</Button>
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
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
                                    <SafeImage
                                        src={fav.photo}
                                        alt={fav.name}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform"
                                        loading="lazy"
                                    />
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        className="absolute top-2 right-2 h-11 w-11 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            removeFavorite(fav.id);
                                        }}
                                        aria-label={`Eliminar ${fav.name} de favoritos`}
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
            </main>
        </div>
    );
}


