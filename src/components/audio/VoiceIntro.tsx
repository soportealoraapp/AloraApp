'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { VoiceRecorder } from '@/components/audio/VoiceRecorder';
import { VoicePlayer } from '@/components/audio/VoicePlayer';
import { useUploadThing } from '@/utils/uploadthing';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VoiceIntroProps {
    audioUrl?: string | null;
    duration?: number | null;
    onSave: (url: string, duration: number) => void;
    onDelete: () => void;
    isOwn?: boolean;
}

export function VoiceIntro({ audioUrl, duration, onSave, onDelete, isOwn = true }: VoiceIntroProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [previewDuration, setPreviewDuration] = useState(0);
    const [uploading, setUploading] = useState(false);
    const { toast } = useToast();

    const { startUpload } = useUploadThing("voiceUploader", {
        onClientUploadComplete: async (res: any) => {
            if (res && res.length > 0) {
                onSave(res[0].url, previewDuration);
                setPreviewBlob(null);
                toast({ title: "Presentación guardada" });
            }
            setUploading(false);
        },
        onUploadError: () => {
            setUploading(false);
            toast({ title: "Error al subir", variant: "destructive" });
        },
    });

    const handleRecordingComplete = (blob: Blob, duration: number) => {
        if (duration > 30) {
            toast({ title: "Máximo 30 segundos", variant: "destructive" });
            return;
        }
        setPreviewBlob(blob);
        setPreviewDuration(duration);
        setIsRecording(false);
    };

    const handleSave = async () => {
        if (!previewBlob) return;
        setUploading(true);
        const file = new File([previewBlob], `voice-intro-${Date.now()}.webm`, { type: 'audio/webm' });
        await startUpload([file]);
    };

    if (audioUrl && !isOwn) {
        return (
            <Card className="rounded-2xl">
                <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">▶️ Presentación de voz</p>
                    <VoicePlayer src={audioUrl} />
                </CardContent>
            </Card>
        );
    }

    if (audioUrl && isOwn) {
        return (
            <Card className="rounded-2xl">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground">▶️ Tu presentación</p>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    <VoicePlayer src={audioUrl} />
                </CardContent>
            </Card>
        );
    }

    if (isRecording) {
        return (
            <Card className="rounded-2xl border-primary/30">
                <CardContent className="p-4">
                    <p className="text-sm font-medium mb-2">🎤 Cuéntame quién eres</p>
                    <p className="text-xs text-muted-foreground mb-3">Máximo 30 segundos</p>
                    <VoiceRecorder
                        onStop={handleRecordingComplete}
                        onCancel={() => setIsRecording(false)}
                    />
                </CardContent>
            </Card>
        );
    }

    if (previewBlob) {
        return (
            <Card className="rounded-2xl border-primary/30">
                <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-medium">Vista previa</p>
                    <VoicePlayer src={URL.createObjectURL(previewBlob)} />
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewBlob(null)}
                            disabled={uploading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                            Guardar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setIsRecording(true)}
        >
            <Mic className="h-4 w-4" />
            Grabar presentación de voz
        </Button>
    );
}
