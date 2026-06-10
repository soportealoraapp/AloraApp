/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check, Gift, Users, Sparkles, Crown, Zap, BadgeCheck, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface Invited {
    id: string;
    name: string;
    photo: string;
    status: string;
    completedAt?: string | null;
}

interface NextMilestone {
    count: number;
    rewardType: 'boost' | 'plus' | 'badge';
    rewardValue: number;
    label: string;
    description: string;
}

interface ReferralData {
    code: string;
    link: string;
    stats: {
        totalInvited: number;
        totalCompleted: number;
        rewards: Array<{ type: string; value: number }>;
        tiers: Array<{ count: number; label: string; description: string }>;
        nextMilestone: NextMilestone | null;
    };
    invited: Invited[];
}

const REWARD_ICONS: Record<string, any> = {
    boost: Zap,
    plus: Crown,
    badge: BadgeCheck,
};

const REWARD_COLORS: Record<string, string> = {
    boost: 'from-amber-400 to-orange-500',
    plus: 'from-purple-500 to-pink-500',
    badge: 'from-yellow-400 to-amber-500',
};

export default function ReferralPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [data, setData] = useState<ReferralData | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetch('/api/referral')
            .then(r => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const handleCopy = async () => {
        if (!data?.link) return;
        try {
            await navigator.clipboard.writeText(data.link);
            setCopied(true);
            toast({ title: '¡Enlace copiado! ✨' });
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast({ title: 'Error al copiar', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60 p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="md:pl-60 p-6">
                <p className="text-muted-foreground">No se pudo cargar la información de referidos</p>
            </div>
        );
    }

    const { stats, link, invited, code } = data;
    const progressToNext = stats.nextMilestone
        ? Math.min(100, (stats.totalCompleted / stats.nextMilestone.count) * 100)
        : 100;

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Gift className="h-6 w-6 text-pink-500" />
                        Invita y gana
                    </h1>
                    <p className="text-sm text-muted-foreground">Comparte Alora y obtén recompensas</p>
                </div>
            </div>

            {/* Code & Link */}
            <Card className="rounded-3xl border-none shadow-sm bg-gradient-to-br from-primary/5 via-background to-pink-500/5">
                <CardContent className="p-6 space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tu código único</p>
                        <p className="text-2xl font-bold tracking-widest text-primary">{code}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Enlace para compartir</p>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted px-3 py-2 rounded-xl text-xs font-mono break-all text-muted-foreground">
                                {link}
                            </div>
                            <Button onClick={handleCopy} size="icon" className="shrink-0">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Progress */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <p className="font-bold text-sm">Tu progreso</p>
                    </div>
                    <div className="flex items-baseline gap-2 mb-1">
                        <p className="text-3xl font-bold text-primary">{stats.totalCompleted}</p>
                        <p className="text-sm text-muted-foreground">personas invitadas</p>
                    </div>
                    {stats.nextMilestone && (
                        <div className="mt-3 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                    {stats.totalCompleted} / {stats.nextMilestone.count}
                                </span>
                                <span className="font-bold text-primary">{progressToNext.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-primary to-pink-500"
                                    style={{ width: `${progressToNext}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Faltan {stats.nextMilestone.count - stats.totalCompleted} para {stats.nextMilestone.label}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Reward Tiers */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        <p className="font-bold text-sm">Recompensas</p>
                    </div>
                    <div className="space-y-2">
                        {stats.tiers.map((tier) => {
                            const achieved = stats.totalCompleted >= tier.count;
                            return (
                                <div
                                    key={tier.count}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border ${
                                        achieved
                                            ? 'bg-green-50/50 border-green-200'
                                            : 'bg-card border-border opacity-70'
                                    }`}
                                >
                                    <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${
                                        achieved ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                        {achieved ? <Check className="h-5 w-5" /> : tier.count}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{tier.label}</p>
                                        <p className="text-xs text-muted-foreground">{tier.description}</p>
                                    </div>
                                    {achieved && (
                                        <span className="text-xs font-bold bg-green-500 text-white px-2 py-0.5 rounded-full">
                                          Conseguido
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Earned rewards */}
            {stats.rewards.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <p className="font-bold text-sm mb-3">Recompensas obtenidas</p>
                        <div className="space-y-2">
                            {stats.rewards.map((r, i) => {
                                const Icon = REWARD_ICONS[r.type] || Sparkles;
                                return (
                                    <div key={i} className="flex items-center gap-2 text-sm">
                                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${REWARD_COLORS[r.type]} flex items-center justify-center`}>
                                            <Icon className="h-4 w-4 text-white" />
                                        </div>
                                        <span className="font-medium">
                                            {r.type === 'boost' && `+${r.value} boost`}
                                            {r.type === 'plus' && `${r.value} días Plus`}
                                            {r.type === 'badge' && 'Badge exclusivo'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Invited users */}
            {invited.length > 0 && (
                <Card>
                    <CardContent className="p-6">
                        <p className="font-bold text-sm mb-3">Personas invitadas ({invited.length})</p>
                        <div className="space-y-2">
                            {invited.map((person) => (
                                <div key={person.id} className="flex items-center gap-3 p-2 rounded-xl">
                                    <img
                                        src={person.photo}
                                        alt={person.name}
                                        className="h-10 w-10 rounded-full object-cover border"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{person.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {person.completedAt
                                                ? `Se unió ${new Date(person.completedAt).toLocaleDateString('es-MX')}`
                                                : 'Pendiente'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

