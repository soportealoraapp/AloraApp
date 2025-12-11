'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";
import { profileInsightsGenerator } from "@/ai/profile-insights/generator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/custom/SectionTitle";

export default function AnalyticsPage() {
    const { profile } = useAuth();

    const insights = useMemo(() => {
        if (!profile) return null;
        return profileInsightsGenerator.generateInsights(profile);
    }, [profile]);

    if (!profile || !insights) return <div className="p-8">Cargando análisis...</div>;

    // Mock Data for Charts
    const personalityData = [
        { subject: 'Aventura', A: 80, fullMark: 100 },
        { subject: 'Empatía', A: 90, fullMark: 100 },
        { subject: 'Intelecto', A: 70, fullMark: 100 },
        { subject: 'Energía', A: 85, fullMark: 100 },
        { subject: 'Estabilidad', A: 65, fullMark: 100 },
    ];

    const activityData = [
        { name: 'Lun', interaction: 40 },
        { name: 'Mar', interaction: 30 },
        { name: 'Mie', interaction: 20 },
        { name: 'Jue', interaction: 27 },
        { name: 'Vie', interaction: 90 },
        { name: 'Sab', interaction: 85 },
        { name: 'Dom', interaction: 60 },
    ];

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-pink-50/30 min-h-screen">
            <SectionTitle title="Love Analytics" subtitle="Tu perfil bajo la lupa de nuestra IA" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Insights Card */}
                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-pink-500">Tu Personalidad IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-medium text-gray-700 mb-4">{insights.personalitySummary}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {insights.topAffinities.map(aff => <Badge key={aff} variant="secondary">{aff}</Badge>)}
                        </div>
                        <p className="text-sm text-gray-500">{insights.seekingAnalysis}</p>
                    </CardContent>
                </Card>

                {/* Photo Score */}
                <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader><CardTitle>Impacto de Perfil</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500 mb-2">
                            {insights.photoScore}
                        </div>
                        <p className="text-gray-500">Puntaje de Atracción (Beta)</p>
                    </CardContent>
                </Card>

                {/* Radar Chart */}
                <Card className="col-span-1 md:col-span-2 border-none shadow-xl bg-white">
                    <CardHeader><CardTitle>Radar de Compatibilidad</CardTitle></CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={personalityData}>
                                <PolarGrid stroke="#fbcfe8" />
                                <PolarAngleAxis dataKey="subject" />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                                <Radar name="Tú" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Activity Chart */}
                <Card className="col-span-1 md:col-span-2 border-none shadow-xl bg-white">
                    <CardHeader><CardTitle>Mejores Horarios</CardTitle></CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-gray-500">Tu hora dorada es: <span className="font-bold text-pink-500">{insights.bestActiveHours}</span></p>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={activityData}>
                                    <XAxis dataKey="name" />
                                    <Tooltip />
                                    <Bar dataKey="interaction" fill="#f472b6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Upgrade Prompt */}
                <Card className="col-span-1 md:col-span-2 border-2 border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 cursor-pointer hover:shadow-2xl transition-all">
                    <CardContent className="flex flex-col md:flex-row items-center justify-between p-6">
                        <Button asChild className="w-full bg-transparent hover:bg-transparent shadow-none text-left p-0 h-auto">
                            <a href="/settings/subscription" className="flex flex-col md:flex-row items-center w-full gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">¿Quieres insights más profundos?</h3>
                                    <p className="text-gray-600">Desbloquea el análisis de comportamiento y matchmaking predictivo con Premium.</p>
                                </div>
                                <div className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold whitespace-nowrap">
                                    Ver Planes
                                </div>
                            </a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
