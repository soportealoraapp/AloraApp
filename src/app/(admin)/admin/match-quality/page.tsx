'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { Loader2, RefreshCw, MessageSquare, Heart, Users, BarChart3, TrendingUp, Activity, Ghost, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Metrics {
    totalMatches: number;
    activeConversations: number;
    engagementRate: number;
    avgMessagesPerConversation: number;
    responseRate: number;
    compatibilityCorrelation: number;
    ghostingRate: number;
    longConversations: number;
    avgResponseTime: number;
    plusConversions: number;
}

export default function MatchQualityPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/match-quality')
            .then(r => r.json())
            .then(setMetrics)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="md:pl-sidebar p-6 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!metrics) {
        return (
            <div className="md:pl-sidebar p-6 flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">No se pudieron cargar las métricas</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    const cards = [
        { title: 'Matches Totales', value: metrics.totalMatches, icon: Heart, color: 'text-pink-500' },
        { title: 'Conversaciones Activas', value: metrics.activeConversations, icon: MessageSquare, color: 'text-blue-500' },
        { title: 'Tasa de Engagement', value: `${metrics.engagementRate}%`, icon: TrendingUp, color: 'text-green-500' },
        { title: 'Mensajes/Conversación', value: metrics.avgMessagesPerConversation, icon: BarChart3, color: 'text-purple-500' },
        { title: 'Tasa de Respuesta', value: `${metrics.responseRate}%`, icon: Activity, color: 'text-orange-500' },
        { title: 'Compatibilidad Promedio', value: `${metrics.compatibilityCorrelation}%`, icon: Users, color: 'text-cyan-500' },
        { title: 'Tasa de Ghosting', value: `${metrics.ghostingRate}%`, icon: Ghost, color: 'text-red-500' },
        { title: 'Conversaciones Largas', value: metrics.longConversations, icon: MessageSquare, color: 'text-indigo-500' },
        { title: 'Tiempo Respuesta Prom.', value: `${metrics.avgResponseTime}h`, icon: Clock, color: 'text-yellow-500' },
        { title: 'Conversiones Plus', value: metrics.plusConversions, icon: ArrowUpRight, color: 'text-emerald-500' },
    ];

    return (
        <div className="md:pl-sidebar p-6 space-y-6">
            <SectionTitle title="Análisis de Calidad de Matches" subtitle="Métricas de calidad de conexiones" />
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
                {cards.map((card) => (
                    <Card key={card.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                            <card.icon className={`h-4 w-4 ${card.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{card.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Análisis de Calidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Engagement Rate</h4>
                            <p className="text-sm text-muted-foreground">
                                {metrics.engagementRate >= 60
                                    ? 'Excelente — la mayoría de los matches generan conversación'
                                    : metrics.engagementRate >= 40
                                    ? 'Bueno — hay espacio para mejorar la calidad de matches'
                                    : 'Necesita atención — muchos matches no generan conversación'}
                            </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Ghosting Rate</h4>
                            <p className="text-sm text-muted-foreground">
                                {metrics.ghostingRate <= 30
                                    ? 'Bajo ghosting — buena retención de matches'
                                    : metrics.ghostingRate <= 50
                                    ? 'Ghosting moderado — mejorar icebreakers'
                                    : 'Alto ghosting — revisar calidad de matching'}
                            </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Tasa de Respuesta</h4>
                            <p className="text-sm text-muted-foreground">
                                {metrics.responseRate >= 70
                                    ? 'Los usuarios responden consistentemente'
                                    : metrics.responseRate >= 50
                                    ? 'Respuestas moderadas — considerar mejorar icebreakers'
                                    : 'Baja tasa de respuesta — revisar calidad de mensajes'}
                            </p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <h4 className="font-medium mb-2">Conversiones Plus</h4>
                            <p className="text-sm text-muted-foreground">
                                {metrics.plusConversions > 0
                                    ? `${metrics.plusConversions} usuarios activos en Plus esta semana`
                                    : 'Sin conversiones Plus esta semana'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
