'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, X } from 'lucide-react';
import { PaywallModal } from './PaywallModal';

interface UpgradePromptProps {
    trigger: 'likes_exhausted' | 'travel_mode' | 'incognito';
    className?: string;
}

const TRIGGER_CONFIG = {
    likes_exhausted: {
        title: 'Likes agotados',
        description: 'Con Alora+ tienes likes ilimitados para conectar sin límites.',
    },
    travel_mode: {
        title: 'Explora otras ciudades',
        description: 'El Modo Viaje está disponible exclusivamente para Alora+.',
    },
    incognito: {
        title: 'Modo Incógnito',
        description: 'Controla quién ve tu perfil con Alora+.',
    },
};

export function UpgradePrompt({ trigger, className }: UpgradePromptProps) {
    const [showPaywall, setShowPaywall] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const dismissalKey = `upgrade_prompt_${trigger}_dismissed`;
        const dismissedAt = localStorage.getItem(dismissalKey);
        if (dismissedAt) {
            const hoursSinceDismissal = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60);
            if (hoursSinceDismissal < 24) {
                setDismissed(true);
            }
        }
    }, [trigger]);

    const handleDismiss = () => {
        setDismissed(true);
        localStorage.setItem(`upgrade_prompt_${trigger}_dismissed`, Date.now().toString());
    };

    if (dismissed) return null;

    const config = TRIGGER_CONFIG[trigger];

    return (
        <>
            <Card className={`border-dashed border-primary/30 bg-primary/5 ${className}`}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-primary/10 flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-sm">{config.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{config.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <Button size="sm" variant="default" onClick={() => setShowPaywall(true)}>
                            Ver planes
                        </Button>
                        <Button size="icon" variant="ghost" className="h-11 w-11" onClick={handleDismiss} aria-label="Ocultar">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </>
    );
}
