'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Heart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
import { LikesCounterModal } from './LikesCounterModal';

interface LikesCounterProps {
    dailyLikesUsed: number;
    dailyLikesLimit: number;
    superlikesRemaining: number;
    resetAt: Date | string;
    subscriptionStatus?: string;
    className?: string;
    onReset?: () => void;
}

export function LikesCounter({
    dailyLikesUsed,
    dailyLikesLimit,
    superlikesRemaining,
    resetAt,
    subscriptionStatus = 'free',
    className,
    onReset
}: LikesCounterProps) {
    const [now, setNow] = useState(new Date());
    const [showModal, setShowModal] = useState(false);
    const prevResetRef = useRef(resetAt);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Detect reset (new day) and trigger callback
    useEffect(() => {
        if (prevResetRef.current !== resetAt) {
            prevResetRef.current = resetAt;
            onReset?.();
        }
    }, [resetAt, onReset]);

    const resetDate = useMemo(() => {
        const d = new Date(resetAt);
        // If the reset date is in the past, or we want specifically "midnight tomorrow"
        // we can adjust here, but usually the backend sends the correct next reset time.
        return d;
    }, [resetAt]);

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
        if (diff <= 0) return "00:00:00";
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
                        Se reinician en {timeUntilReset}
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
                superlikesRemaining={superlikesRemaining}
                resetAt={resetAt}
            />
        </>
    );
}
