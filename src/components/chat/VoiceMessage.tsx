'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceMessageProps {
    audioUrl: string;
    duration?: number;
    isOwn?: boolean;
}

export function VoiceMessage({ audioUrl, duration: propDuration, isOwn = false }: VoiceMessageProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(propDuration || 0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const animationRef = useRef<number>();
    const progressBarRef = useRef<HTMLDivElement>(null);

    // Stable bar heights - computed once
    const barHeights = useMemo(() => {
        return Array.from({ length: 20 }).map((_, i) => {
            const seed = i * 7 + 3;
            return 4 + ((seed % 11) / 11) * 12;
        });
    }, []);

    useEffect(() => {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        });

        return () => {
            audio.pause();
            audio.src = '';
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [audioUrl]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            audio.play();
            setIsPlaying(true);
        }
    };

    const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        const bar = progressBarRef.current;
        if (!audio || !bar || duration <= 0) return;

        const rect = bar.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, x / rect.width));
        audio.currentTime = percentage * duration;
        setCurrentTime(audio.currentTime);
    }, [duration]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-2xl max-w-[250px]",
            isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
        )}>
            <Button
                size="sm"
                variant="ghost"
                className={cn(
                    "h-8 w-8 p-0 rounded-full flex-shrink-0",
                    isOwn ? "hover:bg-primary-foreground/20 text-primary-foreground" : "hover:bg-muted-foreground/20"
                )}
                onClick={togglePlay}
            >
                {isPlaying ? (
                    <Pause className="h-4 w-4 fill-current" />
                ) : (
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                )}
            </Button>

            <div className="flex-1 min-w-0">
                <div
                    ref={progressBarRef}
                    className="flex items-center gap-1 cursor-pointer"
                    onClick={handleSeek}
                >
                    {barHeights.map((barHeight, i) => {
                        const isActive = (i / 20) * 100 <= progress;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "w-[3px] rounded-full transition-all duration-100",
                                    isActive
                                        ? isOwn ? "bg-primary-foreground" : "bg-primary"
                                        : isOwn ? "bg-primary-foreground/30" : "bg-muted-foreground/30"
                                )}
                                style={{ height: barHeight }}
                            />
                        );
                    })}
                </div>
                <div className={cn(
                    "text-xs mt-0.5",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                )}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>
        </div>
    );
}
