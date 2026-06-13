'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Heart, Zap, ShieldCheck, RotateCcw, Globe, Eye, Star, Users } from 'lucide-react';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TIERS = [
    {
        id: 'free',
        name: 'Alora Free',
        price: 0,
        period: '',
        features: [
            '30 likes diarios',
            'Matching y chat',
            'Daily compatibility',
            'Pregunta del día',
        ],
        highlighted: false,
    },
    {
        id: 'plus',
        name: 'Alora+',
        price: 99,
        period: 'MXN / mes',
        annualPrice: 79,
        annualPeriod: 'MXN / mes (anual)',
        features: [
            'Likes ilimitados',
            'Prioridad en Discover',
            'Boost de visibilidad',
            'Rewind (3 al día)',
            'Modo Viaje',
            'Coaching IA personalizado',
            'Insights de compatibilidad profundos',
            'Historial de quién te visitó',
            'Modo incógnito',
        ],
        highlighted: true,
        popular: true,
    },
];

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="sr-only">Elige tu plan</DialogTitle>
                    <DialogDescription className="sr-only">Suscripción premium para desbloquear beneficios</DialogDescription>
                </DialogHeader>

                {/* Hero */}
                <div className="bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground text-center">
                    <div className="bg-white/20 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
                        <Sparkles className="h-8 w-8 text-white fill-white" />
                    </div>
                    <h2 className="text-2xl font-bold mb-1">Elige tu plan</h2>
                    <p className="opacity-90 text-sm">Encuentra conexiones reales más rápido</p>
                </div>

                {/* Social proof */}
                <div className="px-6 pt-4 pb-2">
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>2,000+ usuarios Plus</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span>4.8 estrellas</span>
                        </div>
                    </div>
                </div>

                {/* Tier cards */}
                <div className="p-4 space-y-3 bg-background">
                    {TIERS.map((tier) => (
                        <div
                            key={tier.id}
                            className={`relative rounded-2xl border-2 p-4 transition-all ${
                                tier.highlighted
                                    ? 'border-primary bg-primary/5 shadow-md'
                                    : 'border-muted hover:border-primary/30'
                            }`}
                        >
                            {tier.popular && (
                                <Badge className="absolute -top-2.5 left-4 bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                                    Más popular
                                </Badge>
                            )}
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-bold text-foreground">{tier.name}</h3>
                                    {tier.price > 0 ? (
                                        <div>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-bold">${tier.price}</span>
                                                <span className="text-xs text-muted-foreground">{tier.period}</span>
                                            </div>
                                            {'annualPrice' in tier && tier.annualPrice && (
                                                <p className="text-xs text-green-600 font-medium mt-0.5">
                                                    Anual: ${tier.annualPrice}/mes — Ahorra {Math.round((1 - tier.annualPrice / tier.price) * 100)}%
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-lg font-bold text-muted-foreground">Gratis</span>
                                    )}
                                </div>
                                <Button
                                    variant={tier.highlighted ? 'default' : 'outline'}
                                    className={`rounded-xl px-6 ${tier.highlighted ? 'bg-primary text-primary-foreground' : ''}`}
                                    onClick={() => {
                                        if (tier.id === 'plus') {
                                            window.location.href = 'https://alora-app.lemonsqueezy.com/checkout/buy/67dd777a-6ae1-4169-a2a1-8a1f105899e7';
                                        } else if (tier.id === 'premium') {
                                            window.location.href = 'https://alora-app.lemonsqueezy.com/checkout/buy/67dd777a-6ae1-4169-a2a1-8a1f105899e7';
                                        } else {
                                            onClose();
                                        }
                                    }}
                                >
                                    {tier.price > 0 ? 'Suscribirse' : 'Continuar'}
                                </Button>
                            </div>
                            <div className="space-y-1.5">
                                {tier.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-2 text-xs">
                                        <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <p className="text-[10px] text-center text-muted-foreground pt-2">
                        Suscripción recurrente. Cancela en cualquier momento.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
