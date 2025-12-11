'use client';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { storageService } from "@/lib/firebase/storage-service";

export function StepPhotos({ userId, data, onUpdate, onNext, onPrev }: any) {
    const [photos, setPhotos] = useState<string[]>(data.photos || []);
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !userId) return;

        setUploading(true);
        try {
            const file = e.target.files[0];
            const url = await storageService.uploadProfilePhoto(userId, file, photos.length);
            const newPhotos = [...photos, url];
            setPhotos(newPhotos);
            onUpdate({ photos: newPhotos });
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setUploading(false);
        }
    };

    const removePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index);
        setPhotos(newPhotos);
        onUpdate({ photos: newPhotos });
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-2">Tus Fotos</h2>
            <p className="text-center text-muted-foreground mb-6">Sube al menos 2 fotos para continuar</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((url, index) => (
                    <div key={url} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm group">
                        <Image src={url} alt={`Photo ${index}`} fill className="object-cover" />
                        <button
                            onClick={() => removePhoto(index)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}

                {photos.length < 6 && (
                    <label className="flex flex-col items-center justify-center aspect-[3/4] border-2 border-dashed border-pink-200 rounded-xl cursor-pointer hover:bg-pink-50 transition-colors">
                        {uploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                        ) : (
                            <>
                                <Plus className="h-8 w-8 text-pink-400 mb-2" />
                                <span className="text-sm text-pink-500 font-medium">Añadir</span>
                            </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                    </label>
                )}
            </div>

            <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={onPrev} className="w-1/3">Atrás</Button>
                <Button onClick={onNext} className="w-2/3 bg-pink-500 hover:bg-pink-600" disabled={photos.length < 2}>
                    Siguiente
                </Button>
            </div>
        </div>
    );
}
