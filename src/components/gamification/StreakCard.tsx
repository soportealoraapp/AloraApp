'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Gift, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StreakData {
    currentStreak: number;
    longestStreak: number;
    alreadyCheckedIn: boolean;
    history: boolean[];
    nextRewardIn: number;
    isPlus: boolean;
}

export function StreakCard() {
    const { toast } = useToast();
    const [data, setData] = useState<StreakData | null>(null);
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        fetchStreak();
    }, []);

    const fetchStreak = async () => {
        try {
            const res = await fetch('/api/streak/checkin');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching streak:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async () => {
        setChecking(true);
        try {
            const res = await fetch('/api/streak/checkin', { method: 'POST' });
            const result = await res.json();

            if (result.alreadyCheckedIn) {
                toast({ title: 'Ya registrado', description: result.message });
            } else {
                toast({
                    title: result.rewardsEarned ? 'Recompensa ganada!' : 'Racha actualizada',
                    description: result.message
                });
            }

            await fetchStreak();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setChecking(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-orange-500 h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date().getDay();
    const adjustedToday = today === 0 ? 6 : today - 1;

    return (
        <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className="h-6 w-6" />
                        <div>
                            <p className="text-sm opacity-90">Racha actual</p>
                            <p className="text-3xl font-bold">{data.currentStreak} dias</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-75">Mejor racha</p>
                        <p className="text-lg font-bold">{data.longestStreak}</p>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 space-y-4">
                {/* Last 7 days */}
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Ultimos 7 dias</p>
                    <div className="flex justify-between">
                        {data.history.map((active, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                    active ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                }`}>
                                    {active ? '✓' : '·'}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {dayLabels[(adjustedToday - 6 + i + 7) % 7]}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Check-in button */}
                {!data.alreadyCheckedIn && (
                    <button
                        onClick={handleCheckIn}
                        disabled={checking}
                        className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {checking ? (
                            <Loader2 className="animate-spin h-4 w-4 mx-auto" />
                        ) : (
                            'Registrar actividad de hoy'
                        )}
                    </button>
                )}

                {data.alreadyCheckedIn && (
                    <div className="text-center py-2 text-green-600 font-medium text-sm">
                        Ya registraste tu actividad de hoy
                    </div>
                )}

                {/* Next reward */}
                {data.nextRewardIn > 0 && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Gift className="h-5 w-5 text-pink-500" />
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Siguiente recompensa en {data.nextRewardIn} dias
                            </p>
                            <p className="text-sm font-medium">
                                Boost gratis por racha de {data.isPlus ? 3 : 5} dias
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
