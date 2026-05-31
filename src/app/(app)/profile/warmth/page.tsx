'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getStarsReceived } from '@/server/actions/stars';
import { SocialEnergyShareable } from '@/components/shareables/SocialEnergyCard';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Shield, Activity, TrendingUp } from 'lucide-react';

export default function WarmthPage() {
    const { user, profile } = useAuth();
    const [energy, setEnergy] = useState<number>(0);
    const [stars, setStars] = useState<number>(0);

    useEffect(() => {
        if (!user) return;
        getStarsReceived(user.id).then(setStars);
        const heartScore = (profile as any)?.heartScore ?? 75;
        setEnergy(heartScore);
    }, [user, profile]);

    if (!profile) return <div>Cargando...</div>;

    const breakdown = [
        { label: 'Actividad', value: Math.min(25, Math.round(energy * 0.3)), icon: Activity, color: 'text-blue-500' },
        { label: 'Respeto', value: Math.min(30, Math.round(energy * 0.35)), icon: Shield, color: 'text-green-500' },
        { label: 'Conversaciones', value: Math.min(25, Math.round(energy * 0.25)), icon: MessageCircle, color: 'text-purple-500' },
        { label: 'Conexiones', value: Math.min(20, Math.round(energy * 0.1)), icon: Heart, color: 'text-pink-500' },
    ];

    const tips = [
        'Responde a los mensajes que recibas',
        'Sé respetuoso en todas las interacciones',
        'Mantén conversaciones largas y significativas',
        'Completa tu perfil al 100%',
    ];

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-indigo-50 min-h-screen">
            <SectionTitle title="Social Warmth 🔥" subtitle="Tu impacto positivo en la comunidad" />

            <div className="max-w-2xl mx-auto space-y-6">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-6xl font-bold text-primary mb-2">{energy}</div>
                        <p className="text-muted-foreground">Tu Heart Score</p>
                        <div className="flex items-center justify-center gap-1 mt-2 text-sm text-green-600">
                            <TrendingUp className="h-4 w-4" />
                            <span>Estable</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">Desglose del score</h3>
                        <div className="space-y-3">
                            {breakdown.map(item => (
                                <div key={item.label} className="flex items-center gap-3">
                                    <item.icon className={`h-4 w-4 ${item.color}`} />
                                    <span className="text-sm flex-1">{item.label}</span>
                                    <div className="w-32 bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${item.value}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium w-8 text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">Cómo mejorar tu score</h3>
                        <ul className="space-y-2">
                            {tips.map((tip, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-primary mt-0.5">•</span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <h3 className="font-semibold mb-3">Alora Stars Recibidas</h3>
                        <div className="text-3xl font-bold flex items-center gap-2">
                            {stars} <span className="text-yellow-400">⭐</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">Personas que sintieron una conexión especial contigo.</p>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <SocialEnergyShareable energy={energy} name={(profile as any).displayName || "Usuario"} />
                </div>
            </div>
        </div>
    );
}
