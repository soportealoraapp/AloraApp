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
import { Heart, Sparkles, Clock, Send } from 'lucide-react';
import { PaywallModal } from '@/components/premium/PaywallModal';
import { getElevenElevenBoundaries, getElevenElevenLabel, formatCountdown } from '@/lib/eleven-eleven';

interface LikesCounterModalProps {
    isOpen: boolean;
    onClose: () => void;
    remaining: number;
    dailyLikesLimit: number;
    superlikesRemaining: number;
    sentLikesCount?: number;
    resetAt?: Date | string;
}

export function LikesCounterModal({ isOpen, onClose, remaining, dailyLikesLimit, superlikesRemaining, sentLikesCount }: LikesCounterModalProps) {
    const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const updateTimer = () => {
            const now = new Date();
            const { next: targetDate } = getElevenElevenBoundaries(now, Intl.DateTimeFormat().resolvedOptions().timeZone);
            const diff = targetDate.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilReset('00h 00m');
                return;
            }

            setTimeUntilReset(formatCountdown(targetDate, now));
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [isOpen]);

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
                            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-200 dark:from-purple-900/40 dark:to-pink-900/30 flex items-center justify-center mb-4">
                                <Heart className={isEmpty ? "h-8 w-8 text-purple-400" : "h-8 w-8 text-primary fill-primary"} />
                            </div>
                            <h2 className="text-lg font-bold text-foreground" id="likes-modal-title">
                                {isEmpty ? 'Tus señales se agotaron' : 'Destellos para hoy'}
                            </h2>
                            <p className="text-3xl font-bold mt-2">
                                <span className={isEmpty ? "text-purple-500" : isLow ? "text-warning" : "text-primary"}>
                                    {remaining}
                                </span>
                                <span className="text-lg text-muted-foreground"> / {dailyLikesLimit}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-xl p-4 text-center border border-purple-200/50 dark:border-purple-800/40">
                                <div className="flex items-center justify-center gap-2 text-purple-600 dark:text-purple-300 mb-1">
                                    <Clock className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Se activan</span>
                                </div>
                                <p className="text-xl font-mono font-bold text-foreground">
                                    {timeUntilReset || '...'}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                    (A las {getElevenElevenLabel(getElevenElevenBoundaries(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone).next, Intl.DateTimeFormat().resolvedOptions().timeZone)})
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
                            <div className="bg-muted/50 rounded-xl p-4 text-center col-span-2">
                                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                                    <Send className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wider">Enviados</span>
                                </div>
                                <p className="text-xl font-bold text-foreground">{sentLikesCount ?? 0}</p>
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
                                    {isEmpty ? 'Recibe más señales con Alora+' : 'Subir de nivel con Alora+'}
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
