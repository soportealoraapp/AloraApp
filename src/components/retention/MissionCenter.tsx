'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, CheckCircle2, Circle, Trophy, Zap, Share2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export function MissionCenter() {
    const { profile } = useAuth();
    const { toast } = useToast();

    // In a real app, this would be fetched from retentionServerService.checkMissions
    const missions = [
        { id: 'daily_login', title: 'Visita diaria', desc: 'Racha activa por 24h', reward: '+1 día', progress: 1, target: 1, completed: true },
        { id: 'icebreaker', title: 'Rompehielos', desc: 'Inicia conversación con IA', reward: 'Boost Gratis', progress: 0, target: 1, completed: false },
        { id: 'compatibility', title: 'Curioso', desc: 'Completa un nuevo quiz', reward: 'Badge', progress: 0.5, target: 1, completed: false },
    ];

    const currentStreak = (profile as any)?.streaks?.currentCount || 0;

    const handleInvite = () => {
        const code = (profile as any)?.referralCode || 'ALORA-GIFT';
        const url = `https://alora.app/invite/${code}`;
        navigator.clipboard.writeText(url);
        toast({
            title: "Enlace copiado",
            description: "Envíalo a tus amigos para ganar un Boost.",
        });
    };

    return (
        <div className="space-y-6">
            {/* Streak Hero */}
            <Card className="bg-gradient-to-br from-orange-500 to-rose-500 text-white border-none rounded-3xl overflow-hidden shadow-xl">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-bold uppercase tracking-widest">Racha Actual</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-5xl font-black">{currentStreak}</h3>
                                <span className="text-xl font-bold opacity-80">Días</span>
                            </div>
                        </div>
                        <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                            <Flame className={`h-12 w-12 ${currentStreak > 0 ? 'fill-orange-300 text-white' : 'text-white/40'}`} />
                        </div>
                    </div>
                    <p className="mt-4 text-sm opacity-90 italic">
                        {currentStreak === 0 ? "¡Empieza tu racha hoy!" : "¡Mantén el fuego encendido!"}
                    </p>
                </CardContent>
            </Card>

            {/* Daily Missions */}
            <div className="space-y-4">
                <h4 className="font-bold flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" /> Misiones Diarias
                </h4>
                {missions.map((m) => (
                    <Card key={m.id} className="rounded-2xl border-none shadow-sm bg-card hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                {m.completed ? (
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="bg-muted p-2 rounded-full">
                                        <Circle className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <h5 className="font-bold text-sm">{m.title}</h5>
                                    <p className="text-xs text-muted-foreground">{m.desc}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-xs font-bold text-orange-600 border-orange-100 bg-orange-50">
                                {m.reward}
                            </Badge>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Growth CTA */}
            <Card className="bg-pink-50 border-pink-100 border-dashed border-2 rounded-2xl">
                <CardContent className="p-4 text-center">
                    <h5 className="font-bold text-pink-700 mb-1">¿Sin Boosts?</h5>
                    <p className="text-xs text-pink-600 mb-4">Invita a un amigo y ambos recibiréis uno gratis.</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full bg-background text-pink-600 dark:text-pink-300 rounded-xl font-bold"
                        onClick={handleInvite}
                    >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copiar Enlace de Invitación
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
