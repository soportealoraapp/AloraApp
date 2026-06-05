'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Camera, Upload, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/tracking/client';
import { useUploadThing } from '@/utils/uploadthing';
import Image from 'next/image';
import { CameraCapture } from './CameraCapture';

interface VerificationUploadProps {
    gesture: string;
    onComplete: () => void;
}

function compressImage(file: File, maxWidth = 720, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => {
            const img = document.createElement('img');
            img.onerror = () => reject(new Error('Failed to load image'));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Could not get canvas context')); return; }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else {
                        canvas.toBlob((b) => {
                            if (b) resolve(b);
                            else reject(new Error('Compression failed'));
                        }, 'image/png');
                    }
                }, 'image/jpeg', quality);
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

export function VerificationUpload({ gesture, onComplete }: VerificationUploadProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload } = useUploadThing("verificationUploader", {
        headers: async () => ({ 'x-user-id': user?.id || '' }),
        onClientUploadComplete: async (res: any) => {
            if (res && res.length > 0) {
                setUploadProgress(100);
                const selfieUrl = res[0].url;
                try {
                    const response = await fetch('/api/verification/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ selfieUrl, gesture }),
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
                } catch {
                    toast({
                        variant: 'destructive',
                        title: "Error",
                        description: "No se pudo enviar la verificación.",
                    });
                }
            }
        },
        onUploadProgress: (progress: number) => {
            setUploadProgress(progress);
        },
        onUploadError: (error: any) => {
            const msg = error?.data?.message || error?.message || "Error de conexión. Intenta de nuevo.";
            setUploadProgress(0);
            toast({
                title: "Error al subir",
                description: msg,
                variant: "destructive",
            });
        },
    });

    const handleCameraCapture = useCallback((blob: Blob) => {
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        setSelfieFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setSelfiePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        setIsCameraOpen(false);
    }, []);

    const handleGalleryPick = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 8 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: "Archivo muy grande",
                description: "El tamaño máximo es 8MB. Elige una foto más pequeña.",
            });
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({
                variant: 'destructive',
                title: "Formato no soportado",
                description: "Usa formato JPG, PNG o WebP.",
            });
            return;
        }

        try {
            const compressed = await compressImage(file);
            const compressedFile = new File([compressed], "selfie.jpg", { type: "image/jpeg" });
            setSelfieFile(compressedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelfiePreview(reader.result as string);
            };
            reader.readAsDataURL(compressedFile);
        } catch {
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudo procesar la imagen.",
            });
        }
    }, [toast]);

    const handleSubmit = useCallback(async () => {
        if (!user || !selfieFile) return;

        setUploading(true);
        setUploadProgress(0);
        try {
            await startUpload([selfieFile]);
        } catch {
            setUploadProgress(0);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "No se pudo subir la verificación. Intenta de nuevo.",
            });
        } finally {
            setUploading(false);
        }
    }, [user, selfieFile, startUpload, toast]);

    const handleSkip = useCallback(() => {
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 4, userId: user?.id, skipped: true });
        onComplete();
    }, [user, onComplete]);

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
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleGalleryPick}
            />

            {isCameraOpen && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setIsCameraOpen(false)}
                    onGalleryUpload={() => fileInputRef.current?.click()}
                />
            )}

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
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                                <Camera className="h-6 w-6 mr-2" /> Repetir foto
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

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1"
                >
                    <Upload className="h-3 w-3" /> Subir desde galería
                </button>
            </div>

            {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            )}

            <div className="space-y-4 pt-4">
                <Button
                    onClick={handleSubmit}
                    className="w-full h-12 font-bold"
                    disabled={!selfieFile || uploading}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {uploadProgress > 0 ? `Subiendo ${uploadProgress}%` : "Subiendo..."}
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
