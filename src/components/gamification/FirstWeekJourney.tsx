'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, Sparkles, Loader2, ChevronRight, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface JourneyTask {
    id: string;
    day: number;
    title: string;
    description: string;
    reward: string;
    rewardType: 'likes' | 'boost' | 'badge' | 'plus' | 'trust';
    completed: boolean;
    icon: string;
    href?: string;
}

interface JourneyData {
    daysSinceSignup: number;
    currentDay: number;
    tasks: JourneyTask[];
    completedCount: number;
    totalTasks: number;
    progressPercentage: number;
    hidden: boolean;
}

const REWARD_COLORS: Record<string, string> = {
    likes: 'bg-pink-100 text-pink-700',
    boost: 'bg-amber-100 text-amber-700',
    badge: 'bg-yellow-100 text-yellow-700',
    plus: 'bg-purple-100 text-purple-700',
    trust: 'bg-green-100 text-green-700',
};

export function FirstWeekJourney() {
    const [data, setData] = useState<JourneyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/gamification/journey')
            .then(r => r.json())
            .then(setData)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) return null;
    if (!data || data.hidden) return null;

    const { tasks, completedCount, totalTasks, progressPercentage, currentDay } = data;

    return (
        <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Tu primera semana
                    </CardTitle>
                    <span className="text-[10px] font-bold text-muted-foreground">
                        Día {currentDay}/7
                    </span>
                </div>
                <div className="space-y-1.5 mt-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                            {completedCount} de {totalTasks} completadas
                        </span>
                        <span className="font-bold text-primary">{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-1.5" />
                </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
                {tasks.map((task) => {
                    const isLocked = task.day > currentDay && !task.completed;
                    return (
                        <div
                            key={task.id}
                            className={`flex items-center gap-3 p-2.5 rounded-2xl transition-all ${
                                task.completed
                                    ? 'bg-green-50/50 border border-green-100'
                                    : isLocked
                                        ? 'bg-muted/30 opacity-60'
                                        : 'bg-card border border-border hover:border-primary/30'
                            }`}
                        >
                            <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-lg ${
                                task.completed
                                    ? 'bg-green-500 text-white'
                                    : isLocked
                                        ? 'bg-muted text-muted-foreground'
                                        : 'bg-primary/10'
                            }`}>
                                {task.completed ? (
                                    <CheckCircle className="h-5 w-5" />
                                ) : isLocked ? (
                                    <Lock className="h-4 w-4" />
                                ) : (
                                    <span>{task.icon}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className={`text-sm font-semibold leading-tight ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                        {task.title}
                                    </p>
                                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">
                                        D{task.day}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${REWARD_COLORS[task.rewardType]}`}>
                                        {task.reward}
                                    </span>
                                </div>
                            </div>
                            {!isLocked && !task.completed && task.href && (
                                <Link href={task.href}>
                                    <Button size="sm" variant="ghost" className="h-7 px-2">
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    );
                })}

                {progressPercentage === 100 && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl text-center">
                        <p className="text-2xl mb-1">🏆</p>
                        <p className="font-bold text-sm text-yellow-800">¡Primera semana completada!</p>
                        <p className="text-xs text-yellow-700 mt-0.5">Ya dominas Alora</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
