'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Heart, Sparkles, Stars } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
import { LikesCounterModal } from './LikesCounterModal';
import { getElevenElevenBoundaries, getElevenElevenLabel, formatCountdown } from '@/lib/eleven-eleven';

interface LikesCounterProps {
    dailyLikesUsed: number;
    dailyLikesLimit: number;
    superlikesRemaining: number;
    sentLikesCount?: number;
    resetAt: Date | string;
    subscriptionStatus?: string;
    className?: string;
    onReset?: () => void;
}

export function LikesCounter({
    dailyLikesUsed,
    dailyLikesLimit,
    superlikesRemaining,
    sentLikesCount,
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
    // Use .getTime() comparison to avoid reference equality issues
    useEffect(() => {
        const prevTime = prevResetRef.current instanceof Date
            ? prevResetRef.current.getTime()
            : new Date(prevResetRef.current).getTime();
        const currentTime = resetAt instanceof Date ? resetAt.getTime() : new Date(resetAt).getTime();
        if (prevTime !== currentTime) {
            prevResetRef.current = resetAt;
            onReset?.();
        }
    }, [resetAt, onReset]);

    const isPlus = subscriptionStatus === 'plus';

    const remaining = isPlus ? dailyLikesLimit : Math.max(0, dailyLikesLimit - dailyLikesUsed);
    const percentage = isPlus ? 100 : dailyLikesLimit > 0 ? Math.round((remaining / dailyLikesLimit) * 100) : 0;

    const { next: nextBoundary } = useMemo(
        () => getElevenElevenBoundaries(now, Intl.DateTimeFormat().resolvedOptions().timeZone),
        [now]
    );
    const nextLabel = getElevenElevenLabel(nextBoundary);
    const timeUntilReset = formatCountdown(nextBoundary, now);

    if (isPlus) {
        return (
            <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
                <Heart className="h-3.5 w-3.5 text-primary fill-primary" />
                <span className="font-medium">Me gusta ilimitados</span>
            </div>
        );
    }

    const isLow = remaining <= Math.max(2, Math.floor(dailyLikesLimit * 0.25));
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
                            {remaining} de {dailyLikesLimit} Destellos para hoy
                        </span>
                    </div>
                    {timeUntilReset && (
                    <span className="text-[11px] text-muted-foreground" aria-live="polite">
                        Se activan a las {nextLabel}
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
            {isEmpty && (
                <div className="mt-2 rounded-2xl p-4 bg-gradient-to-br from-purple-100/90 to-pink-100/70 dark:from-purple-900/40 dark:to-pink-900/30 border border-purple-200/70 dark:border-purple-800/50 text-center space-y-1.5 shadow-sm">
                    <div className="flex items-center justify-center gap-1.5 text-purple-600 dark:text-purple-300">
                        <Stars className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">Señales del universo</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-snug">Tus próximas señales del universo se activan en:</p>
                    <p className="text-2xl font-black text-purple-700 dark:text-purple-200 tabular-nums">{timeUntilReset}</p>
                    <p className="text-[11px] text-muted-foreground">(A las {nextLabel})</p>
                    <Button
                        size="sm"
                        variant="outline"
                        className="mt-1 h-9 rounded-full border-purple-300 text-purple-700 hover:bg-purple-200/50 dark:text-purple-200 dark:border-purple-700 dark:hover:bg-purple-800/40"
                        onClick={() => setShowModal(true)}
                    >
                        <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                        Ver planes
                    </Button>
                </div>
            )}

            <LikesCounterModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                remaining={remaining}
                dailyLikesLimit={dailyLikesLimit}
                superlikesRemaining={superlikesRemaining}
                sentLikesCount={sentLikesCount}
                resetAt={resetAt}
            />
        </>
    );
}
