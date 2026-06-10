'use client';

import { useState, useRef, useEffect } from 'react';
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
                <div className="flex items-center gap-1">
                    {Array.from({ length: 20 }).map((_, i) => {
                        const barHeight = 4 + Math.sin(i * 0.8) * 8 + Math.random() * 4;
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
