'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';

export function VoicePlayer({ src, transcription }: { src: string, transcription?: string }) {
    const [playing, setPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (playing) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
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
                    {/* Mock Waveform */}
                    <div className="flex gap-1 h-full items-center">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="w-1 bg-indigo-300 rounded" style={{ height: `${Math.random() * 100}%` }}></div>
                        ))}
                    </div>
                </div>
                <audio ref={audioRef} src={src} onEnded={() => setPlaying(false)} className="hidden" />
            </div>
            {transcription && (
                <p className="text-xs text-gray-500 mt-2 italic px-1">"{transcription}"</p>
            )}
        </div>
    );
}
