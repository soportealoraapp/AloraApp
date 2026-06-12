'use client';

import { useState, useEffect, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
import { LikesCounterModal } from './LikesCounterModal';

interface LikesCounterProps {
    dailyLikesUsed: number;
    dailyLikesLimit: number;
    resetAt: Date | string;
    subscriptionStatus?: string;
    className?: string;
}

export function LikesCounter({
    dailyLikesUsed,
    dailyLikesLimit,
    resetAt,
    subscriptionStatus = 'free',
    className
}: LikesCounterProps) {
    const [now, setNow] = useState(new Date());
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 10000);
        return () => clearInterval(interval);
    }, []);

    const resetDate = useMemo(() => new Date(resetAt), [resetAt]);
    const isPlus = subscriptionStatus === 'plus';

    if (isPlus) {
        return (
            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
                <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="font-medium">Likes ilimitados</span>
            </div>
        );
    }

    const remaining = Math.max(0, dailyLikesLimit - dailyLikesUsed);
    const percentage = Math.round((remaining / dailyLikesLimit) * 100);

    const timeUntilReset = useMemo(() => {
        const diff = resetDate.getTime() - now.getTime();
        if (diff <= 0) return null;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }, [resetDate, now]);

    const isLow = remaining <= 10;
    const isEmpty = remaining === 0;

    return (
        <>
            <button onClick={() => setShowModal(true)} className={cn("w-full text-left space-y-1.5", className)}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <Heart className={cn(
                            "h-3.5 w-3.5",
                            isEmpty ? "text-muted-foreground" : isLow ? "text-warning" : "text-primary fill-primary"
                        )} />
                        <span className="text-xs font-medium text-foreground/80">
                            {remaining} de {dailyLikesLimit} likes para dar hoy
                        </span>
                    </div>
                    {timeUntilReset && (
                    <span className="text-[11px] text-muted-foreground">
                        Se restauran en {timeUntilReset}
                    </span>
                    )}
                </div>
                <Progress
                    value={percentage}
                    className={cn(
                        "h-1.5",
                        isEmpty && "[&>div]:bg-muted-foreground",
                        isLow && !isEmpty && "[&>div]:bg-orange-500"
                    )}
                />
            </button>
            {isEmpty && <UpgradePrompt trigger="likes_exhausted" className="mt-2" />}

            <LikesCounterModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                remaining={remaining}
                dailyLikesLimit={dailyLikesLimit}
                resetAt={resetAt}
            />
        </>
    );
}
