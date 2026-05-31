'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Heart, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface PaywallModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PaywallModal({ isOpen, onClose }: PaywallModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user, refreshProfile } = useAuth();

    const handleSubscribe = async () => {
        setIsSubmitting(true);
        try {
            const response = await fetch('/api/stripe/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: 'plus', userId: user?.id })
            });

            if (!response.ok) throw new Error('Error en la suscripción');

            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast({
                    title: "¡Bienvenido a Alora+!",
                    description: "Tus beneficios premium ya están activos.",
                });
                await refreshProfile();
                onClose();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const features = [
        { icon: <Heart className="text-pink-500 h-5 w-5" />, title: "Likes ilimitados", subtitle: "Sin limites diarios para conectar" },
        { icon: <Zap className="text-blue-500 h-5 w-5" />, title: "Boosts semanales", subtitle: "Destaque prioritario por 30 min" },
        { icon: <Sparkles className="text-amber-500 h-5 w-5" />, title: "Likes prioritarios", subtitle: "Tus likes aparecen primero" },
        { icon: <ShieldCheck className="text-green-500 h-5 w-5" />, title: "Modo incognito", subtitle: "Controla quien te ve" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle>Alora Plus</DialogTitle>
                        <DialogDescription>Suscripción premium para desbloquear beneficios</DialogDescription>
                    </DialogHeader>
                </VisuallyHidden>
                <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-orange-400 p-8 text-white text-center">
                    <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <Sparkles className="h-10 w-10 text-white fill-white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-2">Alora Plus</h2>
                    <p className="opacity-90 text-sm">Eleva tu experiencia y encuentra conexiones reales más rápido.</p>
                </div>

                <div className="p-8 space-y-6 bg-white">
                    <div className="space-y-4">
                        {features.map((f, i) => (
                            <div key={i} className="flex items-start gap-4">
                                <div className="mt-1">{f.icon}</div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">{f.title}</h4>
                                    <p className="text-xs text-muted-foreground">{f.subtitle}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">Plan Mensual</span>
                            <div className="text-2xl font-bold text-gray-900">$99 <span className="text-sm font-normal text-muted-foreground">MXN / mes</span></div>
                        </div>
                        <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold">-20% Hoy</Badge>
                    </div>

                    <Button
                        className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white py-7 rounded-2xl text-lg font-bold shadow-lg hover:shadow-pink-200"
                        onClick={handleSubscribe}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                        Suscribirme Ahora
                    </Button>

                    <p className="text-[10px] text-center text-muted-foreground">
                        Suscripción recurrente. Cancela en cualquier momento. Al suscribirte aceptas nuestros Términos de Uso.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
