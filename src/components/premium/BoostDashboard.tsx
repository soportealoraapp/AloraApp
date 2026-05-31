'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Loader2, Clock, TrendingUp, Heart, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface BoostStats {
    isBoostActive: boolean;
    boostExpiresAt: string | null;
    totalBoosts: number;
    lastBoostAt: string | null;
    nextAvailableAt: string | null;
    isPlus: boolean;
    stats: {
        likesReceived7d: number;
        matchesCreated7d: number;
    };
    history: Array<{
        activatedAt: string;
        totalBoosts: number;
        isPlus: boolean;
    }>;
}

export function BoostDashboard() {
    const { refreshProfile } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<BoostStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    // Countdown timer for active boost
    useEffect(() => {
        if (!stats?.isBoostActive || !stats.boostExpiresAt) return;

        const timer = setInterval(() => {
            const expires = new Date(stats.boostExpiresAt!).getTime();
            const now = Date.now();
            const diff = expires - now;

            if (diff <= 0) {
                setTimeLeft(null);
                clearInterval(timer);
                fetchStats(); // Refresh to show inactive state
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [stats?.isBoostActive, stats?.boostExpiresAt]);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/monetization/boost/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching boost stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async () => {
        setActivating(true);
        try {
            const res = await fetch('/api/monetization/boost', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al activar Boost');

            toast({
                title: 'Boost activado',
                description: 'Tu perfil sera prioritario por 30 minutos.',
            });
            await fetchStats();
            await refreshProfile();
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setActivating(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-pink-500 h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (!stats) return null;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    Mis Boosts
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Active Boost / Activate Button */}
                {stats.isBoostActive ? (
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl p-4 text-white relative overflow-hidden">
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <div className="relative flex items-center justify-between">
                            <div>
                                <p className="font-bold">Boost Activo</p>
                                <p className="text-sm opacity-90">Tu perfil es prioritario ahora</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {timeLeft}
                                </p>
                                <p className="text-xs opacity-75">restantes</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <Button
                            onClick={handleActivate}
                            disabled={activating || (!!stats.nextAvailableAt && new Date(stats.nextAvailableAt) > new Date())}
                            className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white py-6 rounded-2xl font-bold"
                        >
                            {activating ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : stats.nextAvailableAt ? (
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Proximo boost: {new Date(stats.nextAvailableAt).toLocaleDateString('es-MX')}
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" />
                                    Activar Boost
                                </span>
                            )}
                        </Button>
                        <p className="text-center text-xs text-muted-foreground">
                            Boost dura 30 minutos. {stats.isPlus ? '1 boost semanal.' : '1 boost cada 5 dias.'}
                        </p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-pink-50 rounded-xl">
                        <Heart className="h-4 w-4 text-pink-500 mx-auto mb-1" />
                        <p className="text-lg font-bold">{stats.stats.likesReceived7d}</p>
                        <p className="text-[10px] text-muted-foreground">Likes (7d)</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-xl">
                        <Users className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                        <p className="text-lg font-bold">{stats.stats.matchesCreated7d}</p>
                        <p className="text-[10px] text-muted-foreground">Matches (7d)</p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 rounded-xl">
                        <TrendingUp className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        <p className="text-lg font-bold">{stats.totalBoosts}</p>
                        <p className="text-[10px] text-muted-foreground">Total boosts</p>
                    </div>
                </div>

                {/* History */}
                {stats.history.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Historial reciente</p>
                        {stats.history.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded-lg">
                                <span className="text-muted-foreground">
                                    {new Date(item.activatedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                                </span>
                                <Badge variant="secondary" className="text-xs">30 min</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
