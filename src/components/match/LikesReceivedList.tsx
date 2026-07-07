'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrustBadge } from '../ui/premium/TrustBadge';

interface Liker {
    id: string;
    name?: string;
    displayName?: string;
    age?: number;
    photo?: string;
    photos?: string[];
    city?: string;
    trustStatus?: string;
    isVerified?: boolean;
}

export function LikesReceivedList() {
    const router = useRouter();
    const [likers, setLikers] = useState<Liker[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetchLikers(controller.signal);
        return () => controller.abort();
    }, []);

    const fetchLikers = async (signal?: AbortSignal) => {
        try {
            const res = await fetch('/api/match/likes-received', { signal });
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setLikers(data.likers || []);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error("Error fetching likers", error);
                setError(true);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary h-8 w-8" /></div>;

    if (error) return (
        <Card className="rounded-3xl border-dashed bg-muted/20">
            <CardContent className="py-12 text-center text-muted-foreground text-sm space-y-3">
                <p>No se pudieron cargar los likes</p>
                <Button variant="outline" size="sm" onClick={() => { setError(false); setLoading(true); fetchLikers(); }}>
                    Reintentar
                </Button>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-primary fill-primary" />
                    Le gustas a {likers.length} {likers.length === 1 ? 'persona' : 'personas'}
                </h4>
            </div>

            {likers.length === 0 ? (
                <Card className="rounded-3xl border-dashed bg-muted/20">
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                        Aún no tienes nuevos admiradores. ¡Sigue explorando!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                        {likers.map((liker) => (
                            <motion.div
                                key={liker.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 180, damping: 35 }}
                            >
                                <Card
                                    className="rounded-3xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-none shadow-sm active:scale-[0.98]"
                                    onClick={() => router.push(`/profile/${liker.id}`)}
                                >
                                    <div className="aspect-[4/5] relative">
                                        <SafeImage
                                            src={liker.photos?.[0] || '/placeholder.svg'}
                                            alt={liker.displayName || 'Usuario'}
                                            fill
                                            sizes="50vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-3 left-3 text-white flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-sm tracking-tight">{liker.displayName}, {liker.age}</p>
                                                {liker.isVerified && <TrustBadge type="verified" />}
                                            </div>
                                            <p className="text-xs opacity-80 font-medium">{liker.city}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
