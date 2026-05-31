'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/custom/SectionTitle";
import { Heart, Users, MessageCircle, Eye, Lightbulb, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from 'next/navigation';

interface ProfileAnalytics {
    metrics: {
        totalLikesReceived: number;
        likesLast30d: number;
        likesLast7d: number;
        totalMatches: number;
        matchesLast30d: number;
        messagesSent: number;
        messagesReceived: number;
        replyRate: number;
        matchRate: number;
        profileVisits: number;
        quizResults: number;
        completeness: number;
    };
    likesPerWeek: number[];
    recommendations: string[];
    period: string;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [data, setData] = useState<ProfileAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/profile/analytics');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching analytics:', error);
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

    if (!data) {
        return (
            <div className="md:pl-60 p-6">
                <p className="text-muted-foreground">No se pudieron cargar las analiticas.</p>
            </div>
        );
    }

    const { metrics, likesPerWeek, recommendations } = data;

    const chartData = likesPerWeek.map((likes, i) => ({
        name: `Sem ${i + 1}`,
        likes,
    }));

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Rendimiento de Perfil</h1>
                    <p className="text-sm text-muted-foreground">{data.period}</p>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-pink-100 rounded-xl">
                                <Heart className="h-5 w-5 text-pink-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{metrics.likesLast30d}</p>
                                <p className="text-xs text-muted-foreground">Likes (30d)</p>
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
                                <p className="text-2xl font-bold">{metrics.matchesLast30d}</p>
                                <p className="text-xs text-muted-foreground">Matches (30d)</p>
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
                                <p className="text-2xl font-bold">{metrics.replyRate}%</p>
                                <p className="text-xs text-muted-foreground">Tasa respuesta</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-xl">
                                <Eye className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{metrics.profileVisits}</p>
                                <p className="text-xs text-muted-foreground">Visitas perfil</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Likes Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Likes por semana</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="likes" fill="hsl(335, 85%, 76%)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Profile Completeness */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Completitud de perfil</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${metrics.completeness}%` }}
                                />
                            </div>
                        </div>
                        <span className="text-lg font-bold">{metrics.completeness}%</span>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations */}
            {recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-500" />
                            Recomendaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {recommendations.map((rec, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    {rec}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
