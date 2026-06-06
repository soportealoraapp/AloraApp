'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Shield, Sparkles, Brain, Flame, CheckCircle, ArrowRight } from 'lucide-react';

interface ProgressDashboardProps {
    trustScore: { score: number; level: string };
    profileQuality: { score: number; nextTip: string | null };
    quizzesCompleted: number;
    quizzesAvailable: number;
    streak: number;
    insightsAvailable: boolean;
    overallProgress: number;
    onNavigate?: (section: string) => void;
}

export function ProgressDashboard({
    trustScore, profileQuality, quizzesCompleted, quizzesAvailable,
    streak, insightsAvailable, overallProgress, onNavigate
}: ProgressDashboardProps) {
    const items = [
        {
            icon: Shield,
            label: 'Trust Score',
            value: `${trustScore.score}/100`,
            sublabel: trustScore.level,
            progress: trustScore.score,
            color: 'text-blue-500',
            section: 'trust',
        },
        {
            icon: Sparkles,
            label: 'Calidad de Perfil',
            value: `${profileQuality.score}%`,
            sublabel: profileQuality.nextTip || 'Completado',
            progress: profileQuality.score,
            color: 'text-pink-500',
            section: 'profile',
        },
        {
            icon: Brain,
            label: 'Quizzes',
            value: `${quizzesCompleted}/${quizzesAvailable}`,
            sublabel: `${quizzesAvailable - quizzesCompleted} pendientes`,
            progress: (quizzesCompleted / quizzesAvailable) * 100,
            color: 'text-purple-500',
            section: 'compatibility',
        },
        {
            icon: Flame,
            label: 'Racha',
            value: `${streak} días`,
            sublabel: streak > 0 ? '¡Sigue así!' : 'Comienza hoy',
            progress: Math.min(100, streak * 3.33),
            color: 'text-orange-500',
            section: 'streak',
        },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Tu Progreso</CardTitle>
                    <span className="text-2xl font-bold text-primary">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
            </CardHeader>
            <CardContent className="space-y-3">
                {items.map((item) => (
                    <div
                        key={item.label}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onNavigate?.(item.section)}
                    >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{item.label}</span>
                                <span className="text-sm font-bold">{item.value}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                ))}

                {insightsAvailable && (
                    <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                        <p className="text-sm font-medium text-pink-700">💡 Tienes un insight diario nuevo</p>
                        <p className="text-xs text-pink-600">Ábrelo para recibir tu consejo de hoy</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
