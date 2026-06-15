'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function VoicePlayer({ src, transcription }: { src: string, transcription?: string }) {
    const [playing, setPlaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { toast } = useToast();

    // Deterministic waveform based on src
    const bars = useMemo(() => {
        const seed = src.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return Array.from({ length: 20 }, (_, i) => {
            const x = Math.sin(seed + i) * 10000;
            return ((x - Math.floor(x)) * 80) + 20;
        });
    }, [src]);

    // Cleanup on unmount
    useEffect(() => {
        const audio = audioRef.current;
        return () => {
            if (audio) {
                audio.pause();
                audio.src = '';
            }
        };
    }, []);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {
                toast({
                    title: "Error al reproducir audio",
                    variant: "destructive"
                });
            });
        }
        setPlaying(!playing);
    };

    return (
        <div className="bg-card rounded-xl p-3 shadow-sm border border-border max-w-xs">
            <div className="flex items-center gap-3">
                <Button size="icon" className="rounded-full w-10 h-10 bg-indigo-100 text-indigo-600 hover:bg-indigo-200" onClick={togglePlay}>
                    {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                </Button>
                <div className="h-8 w-full bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    <div className="flex gap-1 h-full items-center">
                        {bars.map((height, i) => (
                            <div key={i} className="w-1 bg-indigo-300 rounded" style={{ height: `${height}%` }}></div>
                        ))}
                    </div>
                </div>
                <audio 
                    ref={audioRef} 
                    src={src} 
                    onEnded={() => setPlaying(false)}
                    onLoadStart={() => setLoading(true)}
                    onCanPlay={() => setLoading(false)}
                    onError={() => {
                        setLoading(false);
                        toast({
                            title: "Error al cargar audio",
                            variant: "destructive"
                        });
                    }}
                    className="hidden" 
                />
            </div>
            {transcription && (
                <p className="text-xs text-gray-500 mt-2 italic px-1">"{transcription}"</p>
            )}
        </div>
    );
}
