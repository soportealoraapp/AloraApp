'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, Clock } from 'lucide-react';

interface LikesCounterModalProps {
    isOpen: boolean;
    onClose: () => void;
    remaining: number;
    dailyLikesLimit: number;
    resetAt?: Date | string;
}

export function LikesCounterModal({ isOpen, onClose, remaining, dailyLikesLimit, resetAt }: LikesCounterModalProps) {
    const [timeUntilReset, setTimeUntilReset] = useState('');

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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[380px]">
                <VisuallyHidden>
                    <DialogHeader>
                        <DialogTitle>Likes disponibles</DialogTitle>
                        <DialogDescription>Control de likes diarios</DialogDescription>
                    </DialogHeader>
                </VisuallyHidden>

                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center mb-4">
                            <Heart className={isEmpty ? "h-8 w-8 text-muted-foreground" : "h-8 w-8 text-pink-500 fill-pink-500"} />
                        </div>
                        <h3 className="text-lg font-bold text-foreground">
                            {isEmpty ? 'Likes agotados' : 'Likes disponibles'}
                        </h3>
                        <p className="text-3xl font-bold mt-2">
                            <span className={isEmpty ? "text-muted-foreground" : isLow ? "text-orange-500" : "text-pink-500"}>
                                {remaining}
                            </span>
                            <span className="text-lg text-muted-foreground"> / {dailyLikesLimit}</span>
                        </p>
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">Se reinician en</span>
                        </div>
                        <p className="text-2xl font-mono font-bold text-foreground tracking-wider">
                            {timeUntilReset || '00:00:00'}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full bg-gradient-to-r from-pink-600 to-rose-500 text-white py-6 rounded-2xl text-base font-bold shadow-lg"
                            onClick={() => {
                                window.location.href = 'https://alora-app.lemonsqueezy.com/checkout/buy/67dd777a-6ae1-4169-a2a1-8a1f105899e7';
                            }}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            ¿Quieres más likes? Suscríbete a Alora Plus
                        </Button>
                        <Button variant="outline" className="w-full rounded-2xl" onClick={onClose}>
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
