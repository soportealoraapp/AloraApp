/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, MessageCircle, Users, Shield, TrendingUp, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ExperienceMetrics {
    metrics: {
        likesReceived: number;
        matchesCount: number;
        messagesSent: number;
        messagesReceived: number;
        replyRate: number;
        respectScore: number;
        conversationQuality: number;
        reportsReceived: number;
        blocksReceived: number;
    };
    period: string;
    hasEnoughData: boolean;
}

export default function ExperiencePage() {
    const router = useRouter();
    const [data, setData] = useState<ExperienceMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/safety/experience');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching experience:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60 p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-pink-500 h-8 w-8" />
            </div>
        );
    }

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Tu experiencia en Alora</h1>
                    <p className="text-sm text-muted-foreground">{data?.period || 'Ultimos 30 dias'}</p>
                </div>
            </div>

            {!data?.hasEnoughData ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold mb-2">Estamos aprendiendo sobre ti</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Necesitamos un poco mas de actividad para mostrarte metricas detalladas.
                            Sigue explorando y conectando!
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-pink-100 rounded-xl">
                                        <Heart className="h-5 w-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{data.metrics.likesReceived}</p>
                                        <p className="text-xs text-muted-foreground">Likes recibidos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-xl">
                                        <Users className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{data.metrics.matchesCount}</p>
                                        <p className="text-xs text-muted-foreground">Matches nuevos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-xl">
                                        <MessageCircle className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{data.metrics.replyRate}%</p>
                                        <p className="text-xs text-muted-foreground">Tasa de respuesta</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-xl">
                                        <Shield className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{data.metrics.respectScore}%</p>
                                        <p className="text-xs text-muted-foreground">Respeto recibido</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Calidad de conversaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                                            style={{ width: `${data.metrics.conversationQuality}%` }}
                                        />
                                    </div>
                                </div>
                                <span className="text-lg font-bold">{data.metrics.conversationQuality}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Porcentaje de matches que se convirtieron en conversaciones activas (5+ mensajes)
                            </p>
                        </CardContent>
                    </Card>

                    {data.metrics.reportsReceived > 0 && (
                        <Card className="border-orange-200">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-orange-700">
                                    <Shield className="h-4 w-4" />
                                    <p className="text-sm font-medium">
                                        Has recibido {data.metrics.reportsReceived} reporte(s) en los ultimos 30 dias.
                                    </p>
                                </div>
                                <p className="text-xs text-orange-600 mt-1">
                                    Mantén un trato respetuoso para asegurar una buena experiencia para todos.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}

