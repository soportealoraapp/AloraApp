'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Shield, TrendingUp, TrendingDown, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TrustData {
    score: number;
    level: string;
    factors: { label: string; points: number; positive: boolean }[];
    tips: string[];
    breakdown: {
        completeness: number;
        verified: boolean;
        reportsReceived: number;
        blocksReceived: number;
        responseRate: number;
        isActive: boolean;
    };
}

const LEVEL_COLORS: Record<string, string> = {
    'Nuevo': 'text-muted-foreground',
    'Activo': 'text-blue-500 dark:text-blue-400',
    'Confiable': 'text-green-600 dark:text-green-400',
    'Premium': 'text-purple-500 dark:text-purple-400',
    'Embajador': 'text-yellow-600 dark:text-yellow-400',
};

export default function TrustPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [trust, setTrust] = useState<TrustData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetch('/api/profile/trust')
            .then(r => r.json())
            .then(setTrust)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    if (loading) {
        return (
            <div className="p-6 flex justify-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!trust) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">No se pudo cargar el score de confianza</p>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-dvh">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Tu Score de Confianza</h1>
                    <p className="text-sm text-muted-foreground">Mide tu reputación en la comunidad</p>
                </div>
            </header>
            <main className="p-6 space-y-6">

            <Card>
                <CardContent className="p-6 text-center">
                    <div className={cn("text-6xl font-bold mb-2", LEVEL_COLORS[trust.level] || 'text-muted-foreground')}>
                        {trust.score}
                    </div>
                    <p className="text-muted-foreground mb-1">de 100</p>
                    <p className={cn("font-bold text-lg", LEVEL_COLORS[trust.level])}>
                        {trust.level}
                    </p>
                    <Progress value={trust.score} className="mt-4 h-3" role="progressbar" aria-valuenow={trust.score} aria-valuemin={0} aria-valuemax={100} aria-label="Score de confianza" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Desglose del score</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {trust.factors.map((factor, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {factor.positive ? (
                                    <CheckCircle className="h-4 w-4 text-primary" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-sm">{factor.label}</span>
                            </div>
                            <span className={cn(
                                "font-bold text-sm",
                                factor.positive ? "text-primary" : "text-destructive"
                            )}>
                                {factor.positive ? '+' : ''}{factor.points}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {trust.tips.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-warning" />
                            Cómo mejorar tu score
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {trust.tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <span className="text-primary mt-0.5">•</span>
                                {tip}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Métricas detalladas</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{trust.breakdown.completeness}%</div>
                        <div className="text-xs text-muted-foreground">Perfil</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{trust.breakdown.responseRate}%</div>
                        <div className="text-xs text-muted-foreground">Respuestas</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{trust.breakdown.reportsReceived}</div>
                        <div className="text-xs text-muted-foreground">Reportes</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                        <div className="text-2xl font-bold">{trust.breakdown.blocksReceived}</div>
                        <div className="text-xs text-muted-foreground">Bloqueos</div>
                    </div>
                </CardContent>
            </Card>
            </main>
        </div>
    );
}
