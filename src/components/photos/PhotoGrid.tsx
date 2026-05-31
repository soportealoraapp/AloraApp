'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical, Crop, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoGridProps {
    photos: string[];
    onReorder: (photos: string[]) => void;
    onRemove: (index: number) => void;
    onCrop?: (index: number) => void;
    maxPhotos?: number;
}

export function PhotoGrid({ photos, onReorder, onRemove, onCrop, maxPhotos = 6 }: PhotoGridProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const dragRef = useRef<number | null>(null);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        dragRef.current = index;
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(index));
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIndex(index);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
        e.preventDefault();
        const fromIndex = dragRef.current;
        if (fromIndex === null || fromIndex === toIndex) return;

        const newPhotos = [...photos];
        const [removed] = newPhotos.splice(fromIndex, 1);
        newPhotos.splice(toIndex, 0, removed);
        onReorder(newPhotos);

        setDragIndex(null);
        setOverIndex(null);
        dragRef.current = null;
    }, [photos, onReorder]);

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setOverIndex(null);
        dragRef.current = null;
    }, []);

    return (
        <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
                <div
                    key={`${photo}-${index}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                        "relative aspect-square rounded-lg overflow-hidden group cursor-grab active:cursor-grabbing transition-all",
                        dragIndex === index && "opacity-50 scale-95",
                        overIndex === index && dragIndex !== index && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    <Image src={photo} alt={`Foto ${index + 1}`} fill className="object-cover" />

                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <GripVertical className="h-4 w-4" />
                        </Button>
                        {onCrop && (
                            <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 w-8 p-0"
                                onClick={(e) => { e.stopPropagation(); onCrop(index); }}
                            >
                                <Crop className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0"
                            onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {index === 0 && (
                        <Badge className="absolute top-2 left-2 text-[10px] py-0 px-1.5">
                            <Star className="h-3 w-3 mr-0.5 fill-current" /> Principal
                        </Badge>
                    )}

                    {index > 0 && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                {index + 1}
                            </Badge>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
