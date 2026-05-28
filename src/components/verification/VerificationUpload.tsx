'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/tracking/client';
import { useUploadThing } from '@/utils/uploadthing';
import Image from 'next/image';

interface VerificationUploadProps {
    onComplete: () => void;
}

import { CameraCapture } from './CameraCapture';

export function VerificationUpload({ onComplete }: VerificationUploadProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: async (res: any) => {
            if (res && res.length > 0) {
                const selfieUrl = res[0].url;
                try {
                    const response = await fetch('/api/verification/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ selfieUrl }),
                    });

                    if (!response.ok) throw new Error('Failed to submit verification');

                    trackEvent('VERIFICATION_SUBMITTED', { userId: user?.id });
                    trackEvent('REGISTRATION_STEP_COMPLETED', { step: 4, userId: user?.id });

                    setSubmitted(true);
                    toast({
                        title: "Verificación enviada",
                        description: "Revisaremos tu identidad pronto. Te notificaremos en 24-48 horas.",
                    });
                    setTimeout(() => onComplete(), 2000);
                } catch (error) {
                    toast({
                        variant: 'destructive',
                        title: "Error",
                        description: "No se pudo enviar la verificación.",
                    });
                }
            }
        },
        onUploadError: (error: Error) => {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        },
    });

    const handleCameraCapture = (blob: Blob) => {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setSelfieFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelfiePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setIsCameraOpen(false);
    };

    const handleSubmit = async () => {
        if (!user || !selfieFile) return;

        setUploading(true);
        try {
            await startUpload([selfieFile]);
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudo subir la verificación.",
            });
        } finally {
            setUploading(false);
        }
    };

    const handleSkip = () => {
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 4, userId: user?.id, skipped: true });
        onComplete();
    };

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-green-100 p-4 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">¡Verificación enviada!</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Revisaremos tu solicitud en 24-48 horas. Recibirás una notificación cuando esté lista.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isCameraOpen && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setIsCameraOpen(false)}
                />
            )}

            {/* Privacy notice */}
            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 flex gap-3">
                <Shield className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                    <p className="font-semibold mb-1">Tu privacidad es importante</p>
                    <p>Tu selfie se usa solo para verificar tu identidad. Nunca se muestra en tu perfil y se elimina tras la revisión.</p>
                </div>
            </div>

            <div className="space-y-4">
                <div
                    className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:bg-muted/50 transition-all cursor-pointer group hover:border-primary/50 active:scale-[0.98]"
                    onClick={() => setIsCameraOpen(true)}
                >
                    {selfiePreview ? (
                        <div className="relative h-48 w-full mx-auto animate-in fade-in zoom-in duration-300">
                            <Image src={selfiePreview} alt="Selfie preview" fill className="object-contain rounded-xl" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                Repetir foto
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-semibold">Tomar Selfie</span>
                            <span className="text-xs text-muted-foreground">Sonríe y asegúrate de tener buena iluminación</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <Button
                    onClick={handleSubmit}
                    className="w-full h-12 font-bold"
                    disabled={!selfieFile || uploading || isUploading}
                >
                    {(uploading || isUploading) ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Subiendo...
                        </>
                    ) : (
                        "Enviar Verificación"
                    )}
                </Button>

                <button
                    onClick={handleSkip}
                    disabled={uploading}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    Omitir verificación por ahora
                </button>
            </div>
        </div>
    );
}
