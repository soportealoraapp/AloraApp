'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Gift, Calendar } from 'lucide-react';

interface StreakCardProps {
    currentStreak: number;
    longestStreak: number;
    todayCheckedIn: boolean;
    nextReward: { days: number; reward: string } | null;
    history: { date: string; active: boolean }[];
    onCheckIn?: () => void;
}

export function StreakCard({ currentStreak, longestStreak, todayCheckedIn, nextReward, history, onCheckIn }: StreakCardProps) {
    return (
        <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className="h-6 w-6" />
                        <div>
                            <p className="text-sm opacity-90">Racha actual</p>
                            <p className="text-3xl font-bold">{currentStreak} días</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-75">Mejor racha</p>
                        <p className="text-lg font-bold">{longestStreak}</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 space-y-4">
                {/* Last 7 days */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Últimos 7 días</p>
                    <div className="flex justify-between">
                        {history.map((day, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    day.active ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {day.active ? '✓' : '·'}
                                </div>
                                <span className="text-[10px] text-muted-foreground">
                                    {new Date(day.date).toLocaleDateString('es', { weekday: 'short' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Check-in button */}
                {!todayCheckedIn && (
                    <button
                        onClick={onCheckIn}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Registrar actividad de hoy
                    </button>
                )}

                {todayCheckedIn && (
                    <div className="text-center py-2 text-green-600 font-medium text-sm">
                        ✓ Ya registraste tu actividad de hoy
                    </div>
                )}

                {/* Next reward */}
                {nextReward && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Gift className="h-5 w-5 text-pink-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">Siguiente recompensa en {nextReward.days - currentStreak} días</p>
                            <p className="text-sm font-medium">{nextReward.reward}</p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
