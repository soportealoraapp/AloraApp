'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { useUploadThing } from "@/utils/uploadthing";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/tracking/client";

export function StepPhotos({ userId, data, onUpdate, onNext, onPrev }: any) {
    const [photos, setPhotos] = useState<string[]>(data.photos || []);
    const { toast } = useToast();

    const { startUpload, isUploading } = useUploadThing("imageUploader", {
        onClientUploadComplete: (res: any) => {
            if (res && res.length > 0) {
                const newUrls = res.map((r: any) => r.url);
                const updatedPhotos = [...photos, ...newUrls];
                setPhotos(updatedPhotos);
                onUpdate({ photos: updatedPhotos });
                trackEvent('PHOTO_UPLOADED', { userId, count: res.length });
                toast({ title: "Foto subida correctamente" });
            }
        },
        onUploadError: (error: Error) => {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        },
    });

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !userId) return;
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        await startUpload(files);
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onUpdate({ photos: newPhotos });
    };

    const handleNext = () => {
        trackEvent('REGISTRATION_STEP_COMPLETED', { step: 3, userId });
        onNext();
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2 dark:text-white">Tus Fotos</h2>
            <p className="text-center text-muted-foreground dark:text-gray-400 mb-6 font-medium">Sube al menos 2 fotos para continuar</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((url, index) => (
                    <div key={url} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm group bg-muted transition-transform hover:scale-[1.02]">
                        <Image src={url} alt={`Photo ${index}`} fill className="object-cover" />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {photos.length < 6 && (
                    <label className={`flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-muted-foreground/25 dark:border-pink-900/30 rounded-xl cursor-pointer hover:bg-muted/50 dark:hover:bg-pink-950/10 transition-all hover:border-primary/50 group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        ) : (
                            <>
                                <Plus className="h-8 w-8 text-muted-foreground dark:text-pink-400/50 mb-2 group-hover:text-primary transition-colors" />
                                <span className="text-sm text-primary dark:text-pink-300 font-bold uppercase tracking-widest">Añadir</span>
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isUploading} multiple />
                    </label>
                )}
            </div>

            <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={onPrev} className="w-1/3 hover:bg-muted dark:hover:bg-pink-950/10 active:scale-[0.98] transition-all border-pink-100 dark:border-pink-900/40">Atrás</Button>
                <Button
                    onClick={handleNext}
                    className="w-2/3 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md shadow-pink-100 dark:shadow-pink-950/10"
                    disabled={photos.length < 2 || isUploading}
                >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continuar"}
                </Button>
            </div>
        </div>
    );
}
