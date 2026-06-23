'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, Loader2, Sparkles, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface DailyCompatData {
    found: boolean;
    profile?: {
        id: string;
        displayName: string;
        photos: string[];
        age: number | null;
        city: string | null;
        bio: string | null;
    };
    score?: number;
    sharedValues?: string[];
    sharedInterests?: string[];
    differences?: string[];
    code?: string;
}

export const DailyCompatibilityCard = React.memo(function DailyCompatibilityCard() {
    const { profile: currentUser } = useAuth();
    const [data, setData] = useState<DailyCompatData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPlus, setIsPlus] = useState(false);

    useEffect(() => {
        fetchCompatibility();
    }, []);

    const fetchCompatibility = async () => {
        try {
            const res = await fetch('/api/daily-compatibility');
            const result = await res.json();
            if (!res.ok) {
                setData({ found: false, code: result.code });
                return;
            }
            setData(result);
        } catch (error) {
            console.error('Error fetching daily compatibility:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setIsPlus(currentUser?.subscriptionStatus === 'plus');
    }, [currentUser]);

    const openPaywall = () => {
        const event = new CustomEvent('open-paywall');
        window.dispatchEvent(event);
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-primary h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    // Show blur card for free users with upsell
    if (!isPlus && data?.code === 'subscription_required') {
        return (
            <Card className="overflow-hidden relative">
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-6">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-semibold">Compatibilidad diaria</p>
                        <p className="text-xs text-muted-foreground">Descubre tu conexión más compatible cada día</p>
                    </div>
                    <Button size="sm" className="rounded-full" onClick={openPaywall}>
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Desbloquear con Alora+
                    </Button>
                </div>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Tu conexión destacada
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 opacity-40">
                    <div className="flex items-center gap-3 p-2 rounded-xl">
                        <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0 bg-muted" />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">••••••••</p>
                            <p className="text-xs text-muted-foreground">••••••</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">--%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data?.found || !data.profile) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-primary';
        if (score >= 60) return 'text-accent';
        if (score >= 40) return 'text-warning';
        return 'text-warning';
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Tu conexión destacada
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Link href={`/profile/${data.profile.id}`} className="block">
                    <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors">
                        <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                            <Image
                                src={data.profile.photos?.[0] || '/placeholder.svg'}
                                alt={data.profile.displayName}
                                fill
                                sizes="56px"
                                className="object-cover"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">
                                {data.profile.displayName}
                                {data.profile.age && <span className="text-muted-foreground font-normal">, {data.profile.age}</span>}
                            </p>
                            {data.profile.city && (
                                <p className="text-xs text-muted-foreground">{data.profile.city}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-bold ${getScoreColor(data.score || 0)}`}>
                                {data.score}%
                            </p>
                            <p className="text-xs text-muted-foreground">compatible</p>
                        </div>
                    </div>
                </Link>

                {/* Shared values */}
                {data.sharedValues && data.sharedValues.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Valores compartidos
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {data.sharedValues.slice(0, 3).map(v => (
                                <Badge key={v} variant="secondary" className="text-xs py-0">
                                    {v}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shared interests */}
                {data.sharedInterests && data.sharedInterests.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Intereses en comun
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {data.sharedInterests.slice(0, 3).map(i => (
                                <Badge key={i} variant="outline" className="text-xs py-0">
                                    {i}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Differences */}
                {data.differences && data.differences.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-3 w-3 text-primary" />
                        <span>Diferencias interesantes: {data.differences.join(', ')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});
