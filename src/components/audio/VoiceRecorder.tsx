'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const MAX_DURATION = 120; // 2 minutes

function getAudioMimeType(): string {
    if (typeof navigator !== 'undefined') {
        if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
            return 'audio/mp4';
        }
    }
    return 'audio/webm';
}

export function VoiceRecorder({ onStop, onCancel }: { onStop: (blob: Blob, duration: number) => void; onCancel?: () => void }) {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunks = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const { toast } = useToast();

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
                mediaRecorder.current.stop();
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    // Stop recording when tab becomes hidden
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && mediaRecorder.current?.state === 'recording') {
                stopRecording();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [recording]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mimeType = getAudioMimeType();
            const options = MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : {};
            mediaRecorder.current = new MediaRecorder(stream, options);
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: mimeType });
                const finalDuration = duration;
                setDuration(0);
                onStop(blob, finalDuration);
            };

            mediaRecorder.current.start();
            setRecording(true);

            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    if (prev >= MAX_DURATION - 1) {
                        stopRecording();
                        return prev;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err) {
            console.error("Mic access denied", err);
            toast({
                title: "Permiso de micrófono requerido",
                description: "Necesitamos acceso al micrófono para grabar tu presentación de voz. Por favor, habilita el micrófono en los ajustes de tu navegador.",
                variant: "destructive",
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && recording) {
            mediaRecorder.current.stop();
            setRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="p-4 flex items-center gap-4 bg-muted/50 border-border">
            {recording ? (
                <div className="flex items-center gap-4 w-full justify-between">
                    <div className="flex items-center gap-2 text-destructive animate-pulse font-mono">
                        <div className="w-3 h-3 bg-destructive rounded-full"></div>
                        Rec {formatTime(duration)} / {formatTime(MAX_DURATION)}
                    </div>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button variant="ghost" size="icon" onClick={() => { stopRecording(); onCancel(); }} className="text-muted-foreground hover:text-destructive">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={stopRecording} className="bg-destructive/10 text-destructive hover:bg-destructive/20">
                            <Square className="w-5 h-5 fill-current" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="w-full space-y-2">
                    <p className="text-xs text-muted-foreground leading-tight">Tu voz ayuda a encontrar personas compatibles. Los perfiles con audio reciben 2× más visitas.</p>
                    <Button variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/5 w-full justify-start gap-2" onClick={startRecording}>
                        <Mic className="w-5 h-5" />
                        <span className="text-xs">Grabar Audio</span>
                    </Button>
                </div>
            )}
        </Card>
    );
}
