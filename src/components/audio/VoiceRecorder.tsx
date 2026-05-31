'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function VoiceRecorder({ onStop, onCancel }: { onStop: (blob: Blob, duration: number) => void; onCancel?: () => void }) {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunks = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            chunks.current = [];

            mediaRecorder.current.ondataavailable = (e) => chunks.current.push(e.data);
            mediaRecorder.current.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                onStop(blob, duration);
                setDuration(0);
            };

            mediaRecorder.current.start();
            setRecording(true);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Mic access denied", err);
            alert("Necesitamos acceso al micrófono para grabar notas de voz.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && recording) {
            mediaRecorder.current.stop();
            setRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            // Stop tracks
            mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className="p-4 flex items-center gap-4 bg-gray-50 border-pink-100">
            {recording ? (
                <div className="flex items-center gap-4 w-full justify-between">
                    <div className="flex items-center gap-2 text-red-500 animate-pulse font-mono">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        Rec {formatTime(duration)}
                    </div>
                    <div className="flex gap-2">
                        {onCancel && (
                            <Button variant="ghost" size="icon" onClick={() => { stopRecording(); onCancel(); }} className="text-gray-500 hover:text-red-600">
                                <Trash2 className="w-5 h-5" />
                            </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={stopRecording} className="bg-red-100 text-red-600 hover:bg-red-200">
                            <Square className="w-5 h-5 fill-current" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Button variant="ghost" className="text-gray-500 hover:text-pink-500 hover:bg-pink-50 w-full justify-start gap-2" onClick={startRecording}>
                    <Mic className="w-5 h-5" />
                    <span className="text-xs">Grabar Audio</span>
                </Button>
            )}
        </Card>
    );
}
