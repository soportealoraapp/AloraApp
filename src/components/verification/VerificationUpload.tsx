'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Camera, Upload, CheckCircle } from 'lucide-react';
import { storageService } from '@/lib/firebase/storage-service';
import { verificationService } from '@/lib/firebase/verification-service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/tracking/client';
import Image from 'next/image';

interface VerificationUploadProps {
    onComplete: () => void;
}

import { CameraCapture } from './CameraCapture';

export function VerificationUpload({ onComplete }: VerificationUploadProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [idFile, setIdFile] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [idPreview, setIdPreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'id') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'selfie') {
                    setSelfieFile(file);
                    setSelfiePreview(reader.result as string);
                } else {
                    setIdFile(file);
                    setIdPreview(reader.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

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
        if (!user || !selfieFile || !idFile) return;

        setUploading(true);
        try {
            // 1. Upload Selfie
            const selfieUrl = await storageService.uploadVerificationSelfie(user.uid, selfieFile);

            // 2. Upload ID
            const idUrl = await storageService.uploadVerificationID(user.uid, idFile);

            // 3. Submit Request
            await verificationService.submitVerification(user.uid, selfieUrl, idUrl);

            trackEvent('VERIFICATION_SUBMITTED', { userId: user.uid });
            trackEvent('REGISTRATION_STEP_COMPLETED', { step: 4, userId: user.uid });

            toast({
                title: "Verificación enviada",
                description: "Revisaremos tu identidad pronto. ¡Gracias!",
            });
            onComplete();
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
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 4, userId: user?.uid, skipped: true });
        onComplete();
    };

    return (
        <div className="space-y-6">
            {isCameraOpen && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setIsCameraOpen(false)}
                />
            )}

            <div className="space-y-4">
                <div
                    className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors cursor-pointer group hover:border-primary/50"
                    onClick={() => setIsCameraOpen(true)}
                >
                    {selfiePreview ? (
                        <div className="relative h-48 w-full mx-auto animate-in fade-in zoom-in duration-300">
                            <Image src={selfiePreview} alt="Selfie preview" fill className="object-contain" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity">
                                Repetir foto
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Camera className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span className="font-semibold">Tomar Selfie</span>
                            <span className="text-xs text-muted-foreground">Usa tu cámara para verificar tu rostro</span>
                        </div>
                    )}
                </div>

                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors group hover:border-primary/50">
                    <Label htmlFor="id-upload" className="cursor-pointer block w-full">
                        {idPreview ? (
                            <div className="relative h-48 w-full mx-auto animate-in fade-in zoom-in duration-300">
                                <Image src={idPreview} alt="ID preview" fill className="object-contain" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity">
                                    Cambiar documento
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="font-semibold">Subir Identificación</span>
                                <span className="text-xs text-muted-foreground">DNI, Pasaporte o Licencia</span>
                            </div>
                        )}
                        <input
                            id="id-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, 'id')}
                        />
                    </Label>
                </div>
            </div>

            <div className="space-y-4 pt-4">
                <Button
                    onClick={handleSubmit}
                    className="w-full font-bold hover:scale-105 active:scale-95 transition-transform"
                    disabled={!selfieFile || !idFile || uploading}
                >
                    {uploading ? (
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
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors underline decoration-dotted"
                >
                    Lo haré más tarde
                </button>
            </div>
        </div>
    );
}
