'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, CheckCircle, AlertCircle, ArrowRight, Loader2, Zap } from 'lucide-react';
import Link from 'next/link';

interface ReviewItem {
    key: string;
    label: string;
    done: boolean;
    weight: number;
    action?: string;
    points?: number;
}

interface ReviewResult {
    score: number;
    maxScore: number;
    percentage: number;
    strengths: string[];
    opportunities: ReviewItem[];
    actions: Array<{ label: string; points: number; href: string }>;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
}

export default function ProfileReviewPage() {
    const router = useRouter();
    const [data, setData] = useState<ReviewResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/profile/review')
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6">
                <p className="text-muted-foreground">No se pudo cargar la revisión.</p>
            </div>
        );
    }

    const gradeColors: Record<ReviewResult['grade'], string> = {
        A: 'from-green-500 to-emerald-500',
        B: 'from-blue-500 to-cyan-500',
        C: 'from-yellow-500 to-amber-500',
        D: 'from-orange-500 to-red-500',
        F: 'from-red-500 to-pink-500',
    };

    return (
        <div className="p-6 space-y-6 bg-background min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Revisión de perfil</h1>
                    <p className="text-sm text-muted-foreground">Análisis personalizado de tu perfil</p>
                </div>
            </div>

            <Card className="rounded-3xl border-none shadow-lg overflow-hidden">
                <div className={`bg-gradient-to-br ${gradeColors[data.grade]} p-8 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm opacity-90 mb-1">Tu calificación</p>
                            <p className="text-6xl font-bold">{data.grade}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-5xl font-bold">{data.percentage}<span className="text-2xl">/100</span></p>
                            <p className="text-sm opacity-90 mt-1">puntos</p>
                        </div>
                    </div>
                </div>
            </Card>

            {data.strengths.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Fortalezas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.strengths.map((s, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {data.opportunities.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-warning" />
                            Oportunidades
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {data.opportunities.map((item) => (
                                <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="h-2 w-2 rounded-full bg-warning shrink-0" />
                                        <span className="text-muted-foreground">{item.label}</span>
                                    </div>
                                    <Badge variant="outline" className="text-xs">+{item.weight} pts</Badge>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {data.actions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="h-4 w-4 text-primary" />
                            Acciones recomendadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {data.actions.map((action, i) => (
                            <Link key={i} href={action.href}>
                                <Button variant="outline" className="w-full justify-between h-auto py-3">
                                    <span className="text-left flex-1">{action.label}</span>
                                    <span className="flex items-center gap-2 ml-2">
                                        <Badge className="bg-primary">+{action.points}</Badge>
                                        <ArrowRight className="h-4 w-4" />
                                    </span>
                                </Button>
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )}

            {data.percentage === 100 && (
                <Card className="border-warning bg-warning/10">
                    <CardContent className="p-6 text-center">
                        <p className="text-3xl mb-2">🎉</p>
                        <p className="font-bold text-warning-foreground">¡Perfil perfecto!</p>
                        <p className="text-sm text-warning-foreground/90 mt-1">
                            Estás en el top 1% de Alora. Tu perfil destaca.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
