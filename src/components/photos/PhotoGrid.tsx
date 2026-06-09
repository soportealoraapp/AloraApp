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
    const touchStartRef = useRef<{ x: number; y: number; index: number } | null>(null);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const swapPhotos = useCallback((from: number, to: number) => {
        if (from === to) return;
        const newPhotos = [...photos];
        const [removed] = newPhotos.splice(from, 1);
        newPhotos.splice(to, 0, removed);
        onReorder(newPhotos);
    }, [photos, onReorder]);

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
        swapPhotos(fromIndex, toIndex);
        setDragIndex(null);
        setOverIndex(null);
        dragRef.current = null;
    }, [swapPhotos]);

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setOverIndex(null);
        dragRef.current = null;
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent, index: number) => {
        const touch = e.touches[0];
        touchStartRef.current = { x: touch.clientX, y: touch.clientY, index };
        longPressTimer.current = setTimeout(() => {
            if (touchStartRef.current) {
                setDragIndex(touchStartRef.current.index);
                dragRef.current = touchStartRef.current.index;
            }
        }, 200);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (dragIndex === null || !touchStartRef.current) return;
        e.preventDefault();
        const touch = e.touches[0];
        const touchEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (touchEl) {
            const photoEl = touchEl.closest('[data-photo-index]');
            if (photoEl) {
                const idx = parseInt(photoEl.getAttribute('data-photo-index') || '', 10);
                if (!isNaN(idx) && idx !== dragIndex) {
                    setOverIndex(idx);
                    swapPhotos(dragIndex, idx);
                    setDragIndex(idx);
                    dragRef.current = idx;
                    setOverIndex(null);
                }
            }
        }
    }, [dragIndex, swapPhotos]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        touchStartRef.current = null;
        setDragIndex(null);
        setOverIndex(null);
        dragRef.current = null;
    }, []);

    return (
        <div className="grid grid-cols-3 gap-3">
            {photos.map((photo, index) => (
                <div
                    key={`${photo}-${index}`}
                    data-photo-index={index}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    className={cn(
                        "relative aspect-square rounded-lg overflow-hidden group transition-all",
                        dragIndex === index ? "opacity-50 scale-95 z-10" : "cursor-grab active:cursor-grabbing",
                        overIndex === index && dragIndex !== index && "ring-2 ring-primary ring-offset-2"
                    )}
                >
                    <Image src={photo} alt={`Foto ${index + 1}`} fill className="object-cover pointer-events-none" />

                    <div className="absolute inset-0 bg-black/50 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
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
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity md:group-hover:opacity-100">
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
