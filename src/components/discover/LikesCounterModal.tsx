'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Clock } from 'lucide-react';
import { PaywallModal } from '@/components/premium/PaywallModal';

interface LikesCounterModalProps {
    isOpen: boolean;
    onClose: () => void;
    remaining: number;
    dailyLikesLimit: number;
    superlikesRemaining: number;
    resetAt?: Date | string;
}

export function LikesCounterModal({ isOpen, onClose, remaining, dailyLikesLimit, superlikesRemaining, resetAt }: LikesCounterModalProps) {
    const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const updateTimer = () => {
            const now = new Date();
            const targetDate = resetAt ? new Date(resetAt) : new Date(new Date().setHours(24, 0, 0, 0));
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilReset('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeUntilReset(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isOpen, resetAt]);

    const isLow = remaining <= 10;
    const isEmpty = remaining === 0;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[380px] max-w-[95vw]" aria-labelledby="likes-modal-title" aria-describedby="likes-modal-desc">
                    <DialogHeader>
                        <DialogTitle className="sr-only">Me gusta para dar hoy</DialogTitle>
                        <DialogDescription className="sr-only" id="likes-modal-desc">Control de Me gusta diarios</DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center mb-4">
                                <Heart className={isEmpty ? "h-8 w-8 text-muted-foreground" : "h-8 w-8 text-primary fill-primary"} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground" id="likes-modal-title">
                                {isEmpty ? 'Me gusta agotados' : 'Me gusta para dar hoy'}
                            </h2>
                            <p className="text-3xl font-bold mt-2">
                                <span className={isEmpty ? "text-muted-foreground" : isLow ? "text-warning" : "text-primary"}>
                                    {remaining}
                                </span>
                                <span className="text-lg text-muted-foreground"> / {dailyLikesLimit}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/50 rounded-xl p-4 text-center">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Reinician</span>
                                </div>
                                <p className="text-xl font-mono font-bold text-foreground">
                                    {timeUntilReset || '...'}
                                </p>
                            </div>
                            <div className="bg-primary/5 rounded-xl p-4 text-center border border-primary/10">
                                <div className="flex items-center justify-center gap-2 text-primary/70 mb-1">
                                    <span className="text-xs font-black uppercase tracking-wider">Flechados</span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-xl font-bold text-primary">{superlikesRemaining}</span>
                                    <span className="text-xl" role="img" aria-label="flechado">💘</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {(isLow || isEmpty) && (
                                <Button
                                    className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white py-6 rounded-2xl text-base font-bold shadow-lg"
                                    onClick={() => {
                                        onClose();
                                        setShowPaywall(true);
                                    }}
                                >
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    {isEmpty ? 'Obtener más Me gusta con Alora+' : 'Subir de nivel con Alora+'}
                                </Button>
                            )}
                            <Button variant="outline" className="w-full rounded-2xl" onClick={onClose}>
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </>
    );
}
