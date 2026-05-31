'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
}

export function DailyCompatibilityCard() {
    const [data, setData] = useState<DailyCompatData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCompatibility();
    }, []);

    const fetchCompatibility = async () => {
        try {
            const res = await fetch('/api/daily-compatibility');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching daily compatibility:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-pink-500 h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (!data?.found || !data.profile) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-blue-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-orange-600';
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    Tu conexion destacada
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
                                className="object-cover"
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
                            <p className="text-[10px] text-muted-foreground">compatible</p>
                        </div>
                    </div>
                </Link>

                {/* Shared values */}
                {data.sharedValues && data.sharedValues.length > 0 && (
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Valores compartidos
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {data.sharedValues.slice(0, 3).map(v => (
                                <Badge key={v} variant="secondary" className="text-[10px] py-0">
                                    {v}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shared interests */}
                {data.sharedInterests && data.sharedInterests.length > 0 && (
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                            Intereses en comun
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {data.sharedInterests.slice(0, 3).map(i => (
                                <Badge key={i} variant="outline" className="text-[10px] py-0">
                                    {i}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Differences */}
                {data.differences && data.differences.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Heart className="h-3 w-3 text-pink-400" />
                        <span>Diferencias interesantes: {data.differences.join(', ')}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
