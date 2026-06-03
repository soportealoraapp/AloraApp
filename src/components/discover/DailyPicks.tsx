'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sparkles, ChevronRight, Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { PlusBadge } from '@/components/premium/PlusBadge';

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

export function DailyPicks() {
    const [picks, setPicks] = useState<DailyPick[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/daily-picks')
            .then(r => r.json())
            .then(data => setPicks(data.picks || []))
            .catch(() => {})
            .finally(() => setLoading(false));
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
                    <span className="font-bold text-sm">Para ti hoy</span>
                    <PlusBadge label="Avanzado" />
                </div>
                <span className="text-[10px] text-muted-foreground">Basado en compatibilidad</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {picks.map(pick => (
                    <Link key={pick.id} href={`/profile/${pick.id}?source=daily-pick`}>
                        <Card className="flex-shrink-0 w-48 hover:shadow-lg transition-all cursor-pointer group overflow-hidden">
                            <div className="relative h-40 overflow-hidden">
                                <Image
                                    src={pick.photo}
                                    alt={pick.displayName}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2">
                                    <p className="text-white font-bold text-sm">{pick.displayName}, {pick.age}</p>
                                    <p className="text-white/70 text-[10px]">{pick.city}</p>
                                </div>
                                {pick.isVerified && (
                                    <Badge className="absolute top-2 right-2 bg-blue-500 text-white text-[8px] px-1.5 py-0">
                                        ✓ Verificado
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-3">
                                <p className="text-[10px] text-muted-foreground leading-tight">{pick.reason}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <div className="flex-1 bg-muted rounded-full h-1.5">
                                        <div
                                            className="bg-primary h-1.5 rounded-full"
                                            style={{ width: `${Math.min(100, pick.score)}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] font-bold text-primary">{pick.score}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function Image({ src, alt, fill, className }: { src: string; alt: string; fill?: boolean; className?: string }) {
    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            className={cn("object-cover", fill && "absolute inset-0 w-full h-full", className)}
        />
    );
}
