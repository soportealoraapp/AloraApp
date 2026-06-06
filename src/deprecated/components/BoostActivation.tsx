'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Loader2, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function BoostActivation() {
    const { profile, refreshProfile } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (profile?.boostExpiresAt) {
            const expires = profile.boostExpiresAt instanceof Date
                ? profile.boostExpiresAt
                : (profile.boostExpiresAt as any).toDate();

            const timer = setInterval(() => {
                const now = new Date();
                const diff = expires.getTime() - now.getTime();

                if (diff <= 0) {
                    setTimeLeft(null);
                    clearInterval(timer);
                    refreshProfile();
                } else {
                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
                }
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [profile?.boostExpiresAt]);

    const handleActivate = async () => {
        if (profile?.boostExpiresAt) return;

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/monetization/boost', {
                method: 'POST'
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al activar Boost');

            toast({
                title: "🚀 Perfil destacado",
                description: "Tu perfil será prioritario durante los próximos 30 minutos.",
            });
            await refreshProfile();
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

    const hasBoost = !!profile?.boostExpiresAt;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileTap={{ scale: 0.95 }}
            >
                <Button
                    onClick={handleActivate}
                    disabled={isSubmitting || profile?.trustStatus === 'restricted'}
                    className={`
                        relative overflow-hidden rounded-full px-6 py-6 font-bold shadow-lg transition-all
                        ${hasBoost
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white'
                            : 'bg-white text-blue-600 border-2 border-blue-100 hover:border-blue-200'}
                    `}
                >
                    {isSubmitting ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : hasBoost ? (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 animate-pulse" />
                            <span>{timeLeft} restantes</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 fill-blue-600" />
                            <span>¡Activar Boost! ({profile?.totalBoosts || 0})</span>
                        </div>
                    )}

                    {hasBoost && (
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                    )}
                </Button>
            </motion.div>
        </AnimatePresence>
    );
}
