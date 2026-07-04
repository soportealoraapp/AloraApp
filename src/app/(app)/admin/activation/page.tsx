'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, RefreshCw, TrendingUp, TrendingDown, Users, MessageCircle, Mic, CheckCircle, Sparkles, Crown, Activity, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface FunnelStep {
    name: string;
    count: number;
    conversionFromPrevious: number;
}

interface ActivationData {
    funnel: {
        steps: FunnelStep[];
        overallConversion: number;
        biggestDropoff: string;
    };
    retention: {
        d1: { active: number; total: number; rate: number };
        d7: { active: number; total: number; rate: number };
    };
    plusConversions: number;
    plusConversionRate: number;
    voiceIntroCount: number;
    quizCount: number;
    verifiedCount: number;
    avgCompleteness: number;
}

export default function AdminActivationPage() {
    const router = useRouter();
    const [data, setData] = useState<ActivationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/activation-funnel?extended=true')
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="md:pl-sidebar p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="md:pl-sidebar p-6 flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">No se pudieron cargar las métricas</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    const activationCards = [
        {
            title: 'Usuarios nuevos (30d)',
            value: data.funnel.steps[0]?.count || 0,
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Onboarding completo',
            value: data.funnel.steps[1]?.count || 0,
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-100 dark:bg-green-900/30',
            conversion: data.funnel.steps[1]?.conversionFromPrevious,
        },
        {
            title: 'Quiz completado',
            value: data.quizCount,
            icon: BarChart3,
            color: 'text-indigo-500',
            bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            title: 'Voice intro',
            value: data.voiceIntroCount,
            icon: Mic,
            color: 'text-pink-500',
            bg: 'bg-pink-100 dark:bg-pink-900/30',
        },
        {
            title: 'Verificados',
            value: data.verifiedCount,
            icon: Sparkles,
            color: 'text-amber-500',
            bg: 'bg-amber-100 dark:bg-amber-900/30',
        },
        {
            title: 'Conversaciones activas',
            value: data.funnel.steps[7]?.count || 0,
            icon: MessageCircle,
            color: 'text-purple-500',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
        },
    ];

    return (
        <div className="md:pl-sidebar p-6 space-y-6 bg-muted/30 min-h-dvh">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted"
                    aria-label="Volver"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Dashboard de Activación</h1>
                    <p className="text-sm text-muted-foreground">Embudo, retención y conversión Plus</p>
                </div>
            </div>

            {/* Top metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {activationCards.map((c) => {
                    const Icon = c.icon;
                    return (
                        <Card key={c.title}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 ${c.bg} rounded-xl`}>
                                        <Icon className={`h-5 w-5 ${c.color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-2xl font-bold">{c.value.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground truncate">{c.title}</p>
                                    </div>
                                </div>
                                {c.conversion !== undefined && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {c.conversion.toFixed(1)}% conversión
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Retention */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Retención
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">D1 (día siguiente)</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{data.retention.d1.rate}%</p>
                                <p className="text-xs text-muted-foreground">
                                    {data.retention.d1.active} de {data.retention.d1.total}
                                </p>
                            </div>
                            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={Math.min(100, data.retention.d1.rate)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Retención D1: ${data.retention.d1.rate}%`}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                                    style={{ width: `${Math.min(100, data.retention.d1.rate)}%` }}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">D7 (7 días)</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-bold">{data.retention.d7.rate}%</p>
                                <p className="text-xs text-muted-foreground">
                                    {data.retention.d7.active} de {data.retention.d7.total}
                                </p>
                            </div>
                            <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={Math.min(100, data.retention.d7.rate)}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Retención D7: ${data.retention.d7.rate}%`}
                            >
                                <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                    style={{ width: `${Math.min(100, data.retention.d7.rate)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plus conversion */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-500" />
                        Conversión Plus
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-baseline gap-3">
                        <p className="text-4xl font-bold text-amber-500">{data.plusConversionRate}%</p>
                        <p className="text-sm text-muted-foreground">
                            ({data.plusConversions} suscriptores Plus totales)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Funnel */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Embudo de activación</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {data.funnel.steps.map((step, i) => {
                            const maxCount = Math.max(...data.funnel.steps.map(s => s.count), 1);
                            const widthPct = (step.count / maxCount) * 100;
                            return (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-1 text-sm">
                                        <span className="font-medium">{step.name}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{step.count}</span>
                                            {i > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    ({step.conversionFromPrevious.toFixed(1)}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden"
                                        role="progressbar"
                                        aria-valuenow={Math.min(100, Math.round(widthPct))}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        aria-label={`${step.name}: ${step.count} usuarios`}
                                    >
                                        <div
                                            className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all"
                                            style={{ width: `${widthPct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {data.funnel.biggestDropoff && data.funnel.biggestDropoff.includes('→') && (
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/30 rounded-xl flex items-start gap-2">
                            <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                Mayor caída: <span className="font-bold">{data.funnel.biggestDropoff}</span>
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4 flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <p className="text-sm">
                        <span className="font-bold">Conversión general:</span>{' '}
                        {data.funnel.overallConversion}% de registro a conversación activa
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
