'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Eye, Lock, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaywallModal } from '@/components/premium/PaywallModal';
import { PlusBadge } from '@/components/premium/PlusBadge';

interface Visitor {
    id: string;
    name: string;
    age: number;
    city: string;
    photo: string;
    isVerified: boolean;
    visitedAt: string;
}

export default function VisitorsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [isPlus, setIsPlus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchVisitors = async (offset = 0, append = false) => {
        try {
            const res = await fetch(`/api/profile/visitors?limit=10&offset=${offset}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            if (append) {
                setVisitors(prev => [...prev, ...(data.visitors || [])]);
            } else {
                setVisitors(data.visitors || []);
            }
            setTotal(data.total || 0);
            setHasMore(data.hasMore || false);
            setIsPlus(data.isPlus || false);
        } catch (err) {
            console.error(err);
            setError('Error al cargar los visitantes.');
        }
    };

    useEffect(() => {
        if (!user) return;
        fetchVisitors().finally(() => setLoading(false));
    }, [user]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            await fetchVisitors(visitors.length, true);
        } catch {
            toast({ title: 'Error', description: 'No se pudieron cargar más visitantes.', variant: 'destructive' });
        } finally {
            setLoadingMore(false);
        }
    };

    const hiddenCount = total - visitors.length;

    return (
        <div className="bg-background min-h-dvh">
            <header className="app-page-header gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-semibold md:text-2xl font-headline">Visitantes del perfil</h1>
                        {!isPlus && <PlusBadge label="Beneficio Plus" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{total} persona{total !== 1 ? 's' : ''} visitaron tu perfil</p>
                </div>
            </header>
            <main className="p-6 space-y-6">
            {error && visitors.length === 0 && (
                <Alert variant="destructive">
                    <AlertDescription className="flex items-center justify-between">
                        <span>{error}</span>
                        <Button variant="outline" size="sm" onClick={() => { setError(null); fetchVisitors().finally(() => setLoading(false)); }}>Reintentar</Button>
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : visitors.length === 0 && total === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">Aún no tienes visitantes</p>
                        <p className="text-sm text-muted-foreground">Cuando alguien visite tu perfil, aparecerá aquí</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {visitors.map(visitor => (
                        <Link key={visitor.id} href={`/profile/${visitor.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <Avatar className="h-14 w-14 border">
                                        <AvatarImage src={visitor.photo} alt={visitor.name} />
                                        <AvatarFallback>{visitor.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{visitor.name}, {visitor.age}</p>
                                        <p className="text-sm text-muted-foreground">{visitor.city}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(visitor.visitedAt).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {!isPlus && hiddenCount > 0 && (
                        <Card className="border-dashed border-primary/30 bg-primary/5">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Lock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold text-sm">{hiddenCount} visitante{hiddenCount !== 1 ? 's' : ''} más</p>
                                        <p className="text-xs text-muted-foreground">Desbloquea con Alora+</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => setShowPaywall(true)}>
                                    <Sparkles className="h-4 w-4 mr-1" /> Ver todos
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {hasMore && isPlus && (
                        <div className="text-center pt-4">
                            <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? 'Cargando...' : 'Cargar más'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
            </main>
        </div>
    );
}
