'use client';

import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef } from "react";
import { Plus, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/tracking/client";
import { motion } from "framer-motion";

function compressImage(file: File, maxWidth = 1080, quality = 0.8): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(objectUrl);
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
                else reject(new Error('Compression failed'));
            }, 'image/jpeg', quality);
        };
        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('Failed to load image'));
        };
        img.src = objectUrl;
    });
}

export function StepPhotos({ userId, data, onUpdate, onNext, onPrev }: any) {
    const [photos, setPhotos] = useState<string[]>(data.photos || []);
    const { toast } = useToast();
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: (res: any) => {
            if (res && res.length > 0) {
                const newUrls = res.map((r: any) => r.url);
                const updatedPhotos = [...photos, ...newUrls];
                setPhotos(updatedPhotos);
                setUploadProgress({});
                onUpdate({ photos: updatedPhotos });
                trackEvent('PHOTO_UPLOADED', { userId, count: res.length });
            }
        },
        onUploadProgress: (progress: number) => {
            setUploadProgress({ current: progress });
        },
        onUploadError: (error: Error) => {
            setUploadProgress({});
            setUploadError(error.message || 'Error al subir la foto');
            toast({ title: "Error al subir", description: error.message || 'Intenta de nuevo', variant: "destructive" });
        },
    });

    const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !userId) return;
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadError(null);

        for (const file of files) {
            if (file.size > 4 * 1024 * 1024) {
                toast({ title: "Archivo muy grande", description: "Máximo 4MB por foto", variant: "destructive" });
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                toast({ title: "Formato no soportado", description: "Usa JPG, PNG o WebP", variant: "destructive" });
                return;
            }
        }

        try {
            const compressed = await Promise.all(files.map(f => compressImage(f)));
            const compressedFiles = compressed.map((blob, i) =>
                new File([blob], files[i].name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
            );
            await startUpload(compressedFiles);
        } catch {
            toast({ title: "Error al procesar", description: "No se pudieron comprimir las fotos", variant: "destructive" });
        }
    }, [userId, startUpload, toast]);

    const removePhoto = useCallback((index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onUpdate({ photos: newPhotos });
    }, [photos, onUpdate]);

    const handleNext = useCallback(() => {
        const isIncomplete = photos.length === 0;
        onUpdate({
            photos,
            incomplete_media: isIncomplete
        });
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 3, userId, incomplete: isIncomplete });
        onNext();
    }, [photos, userId, onUpdate, onNext]);

    const currentProgress = Object.values(uploadProgress)[0] || 0;
    const hasProgress = currentProgress > 0 && currentProgress < 100;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Tus Fotos</h2>
            <p className="text-center text-muted-foreground dark:text-gray-400 mb-6 font-medium">Sube fotos para aparecer en recomendaciones (opcional)</p>

            {uploadError && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive"
                >
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {uploadError}
                </motion.div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((url: string, index: number) => (
                    <div key={url} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm group bg-muted transition-transform hover:scale-[1.02] active:scale-[0.98]">
                        <Image src={url} alt={`Photo ${index}`} fill className="object-cover" />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            aria-label="Eliminar foto"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {photos.length < 6 && (
                    <label className={`flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-muted-foreground/25 dark:border-pink-900/30 rounded-xl cursor-pointer hover:bg-muted/50 dark:hover:bg-pink-950/10 transition-all hover:border-primary/50 group active:scale-[0.98] ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                {hasProgress && (
                                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${currentProgress}%` }} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Plus className="h-8 w-8 text-muted-foreground dark:text-pink-400/50 mb-2 group-hover:text-primary transition-colors" />
                                <span className="text-sm text-primary dark:text-pink-300 font-bold uppercase tracking-widest">Añadir</span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleUpload}
                            disabled={isUploading}
                            multiple
                        />
                    </label>
                )}
            </div>

            <div className="flex flex-col gap-3 mt-8">
                <div className="flex gap-4">
                    <Button variant="outline" onClick={onPrev} className="w-1/3 hover:bg-muted dark:hover:bg-pink-950/10 border-pink-100 dark:border-pink-900/40">Atrás</Button>
                    <Button
                        onClick={handleNext}
                        className="w-2/3 shadow-md shadow-pink-100 dark:shadow-pink-950/10"
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (photos.length > 0 ? "Continuar" : "Omitir por ahora")}
                    </Button>
                </div>
                {photos.length === 0 && (
                    <p className="text-[10px] text-center text-muted-foreground px-4">
                        * Podrás añadir fotos más tarde desde tu perfil para empezar a recibir matches.
                    </p>
                )}
            </div>
        </div>
    );
}
