'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';
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

export const DailyPicks = React.memo(function DailyPicks({ }: DailyPicksProps) {
    const [picks, setPicks] = useState<DailyPick[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/api/daily-picks', { signal: controller.signal })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            })
            .then(data => setPicks(data.picks || []))
            .catch((err) => logger.warn('Failed to fetch daily picks', { metadata: { error: err instanceof Error ? err.message : String(err) } }))
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, []);

    if (loading) {
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

    if (picks.length === 0) return null;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="font-bold text-sm">Selecciones diarias</span>
                </div>
                <span className="text-xs text-muted-foreground">Basado en compatibilidad</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {picks.filter(p => p.id && typeof p.id === 'string').map(pick => (
                    <Link key={pick.id} href={`/profile/${encodeURIComponent(pick.id)}?source=daily-pick`}>
                        <Card className="flex-shrink-0 w-48 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
                            <div className="relative h-40 overflow-hidden">
                                <SafeImage
                                    src={pick.photo}
                                    alt={pick.displayName || 'Perfil'}
                                    fill
                                    sizes="192px"
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
});


