'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PlusBadge } from '@/components/premium/PlusBadge';
import { logger } from '@/lib/logger';

interface DailyPick {
    id: string;
    displayName: string;
    age: number;
    city: string;
    photo: string;
    reason: string;
    score: number;
    isVerified: boolean;
}

interface DailyPicksProps {
    subscriptionStatus?: string;
}

export function DailyPicks({ subscriptionStatus = 'free' }: DailyPicksProps) {
    const [picks, setPicks] = useState<DailyPick[]>([]);
    const [loading, setLoading] = useState(true);
    const isPlus = subscriptionStatus === 'plus';

    useEffect(() => {
        fetch('/api/daily-picks')
            .then(r => r.json())
            .then(data => setPicks(data.picks || []))
            .catch(() => logger.warn('Failed to fetch daily picks'))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        if (!isPlus) return null;
        return (
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">Para ti hoy</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex-shrink-0 w-48 h-64 bg-muted/50 rounded-2xl animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (picks.length === 0) return isPlus ? <div className="min-h-[280px]" /> : null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">Para ti hoy</span>
                    <PlusBadge label="Avanzado" />
                </div>
                <span className="text-xs text-muted-foreground">Basado en compatibilidad</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {picks.filter(p => p.id && typeof p.id === 'string').map(pick => (
                    <Link key={pick.id} href={`/profile/${encodeURIComponent(pick.id)}?source=daily-pick`}>
                        <Card className="flex-shrink-0 w-48 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
                            <div className="relative h-40 overflow-hidden">
                                <Image
                                    src={pick.photo}
                                    alt={pick.displayName || 'Perfil'}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-white font-bold text-sm">{pick.displayName || 'Usuario'}, {pick.age || '?'}</p>
                                    <p className="text-white/70 text-xs">{pick.city || ''}</p>
                                </div>
                                {pick.isVerified && (
                                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground text-[8px] px-1.5 py-0">
                                        ✓ Verificado
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-3">
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {(pick.reason || '').split(' · ').slice(0, 2).map((r, i) => (
                                        <span key={i} className="text-[11px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium leading-tight">{r}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="flex-1 bg-muted rounded-full h-1.5">
                                        <div
                                            className="bg-primary h-1.5 rounded-full"
                                            style={{ width: `${Math.min(100, pick.score || 0)}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-bold text-primary">{pick.score || 0}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}


