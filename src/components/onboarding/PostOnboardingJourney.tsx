'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles, Camera, Heart, User, Shield, BookOpen, MessageCircle, MessageSquare, Flame, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface Mission {
    id: string;
    title: string;
    description: string;
    route: string;
    icon: string;
    completed: boolean;
}

interface MissionProgress {
    missions: Mission[];
    streak: number;
    boostUntil: string | null;
    boosted: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
    user: <User className="h-5 w-5" />,
    shield: <Shield className="h-5 w-5" />,
    book: <BookOpen className="h-5 w-5" />,
    message: <MessageCircle className="h-5 w-5" />,
    heart: <Heart className="h-5 w-5" />,
    chat: <MessageSquare className="h-5 w-5" />,
    sparkles: <Sparkles className="h-5 w-5" />,
};

export function PostOnboardingJourney() {
    const { profile, refreshProfile } = useAuth();
    const [data, setData] = useState<MissionProgress | null>(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const res = await fetch('/api/missions', { method: 'POST' });
            if (!res.ok) throw new Error('Failed');
            setData(await res.json());
        } catch {
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.id]);

    // Refresh when returning to the app (e.g. after completing a mission).
    useEffect(() => {
        const onFocus = () => { load(); refreshProfile?.(); };
        window.addEventListener('focus', onFocus);
        window.addEventListener('daily-question-answered', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
            window.removeEventListener('daily-question-answered', onFocus);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Avoid flashing "0/0" before the profile loads.
    if (!profile) return null;

    if (loading && !data) {
        return (
            <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-pulse">
                <div className="h-4 w-40 bg-muted-foreground/20 rounded mb-3" />
                <div className="h-2 w-full bg-muted-foreground/20 rounded" />
            </Card>
        );
    }

    if (!data) return null;

    const missions = data.missions;
    const completedCount = missions.filter(m => m.completed).length;
    const progress = missions.length > 0 ? (completedCount / missions.length) * 100 : 0;
    const nextMission = missions.find(m => !m.completed);
    const boostActive = data.boostUntil && new Date(data.boostUntil).getTime() > Date.now();

    const boostDate = boostActive
        ? new Date(data.boostUntil!).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
        : null;

    return (
        <Card className="p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground">Tu semana en Alora</h3>
                        <p className="text-xs text-muted-foreground">{completedCount}/{missions.length} misiones completadas</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {data.streak > 0 && (
                        <Badge variant="secondary" className="text-xs flex items-center gap-1">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {data.streak}
                        </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                        {Math.round(progress)}%
                    </Badge>
                </div>
            </div>

            <Progress value={progress} className="h-1.5 mb-3" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de misiones" />

            {boostActive && (
                <div className="mb-3 flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <p className="text-xs font-medium text-foreground">Boost de visibilidad activo hasta el {boostDate}</p>
                </div>
            )}

            {nextMission && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3"
                >
                    <p className="text-xs text-muted-foreground mb-1">Próxima misión:</p>
                    <Link
                        href={nextMission.route}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            {ICONS[nextMission.icon] ?? <Sparkles className="h-5 w-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{nextMission.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{nextMission.description}</p>
                        </div>
                        <div className="h-8 px-2 text-primary flex-shrink-0 flex items-center">
                            <ChevronRight className="h-4 w-4" />
                        </div>
                    </Link>
                </motion.div>
            )}

            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                {missions.map((mission) => (
                    <Link
                        key={mission.id}
                        href={mission.route}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors flex-shrink-0 min-w-[40px] ${
                            mission.completed ? 'bg-primary/10' : 'bg-muted/30'
                        }`}
                    >
                        <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                            mission.completed
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        }`}>
                            {mission.completed ? <Check className="h-3.5 w-3.5" /> : ICONS[mission.icon] ?? <Sparkles className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight whitespace-nowrap">
                            {mission.title.split(' ')[0]}
                        </span>
                    </Link>
                ))}
            </div>
        </Card>
    );
}
