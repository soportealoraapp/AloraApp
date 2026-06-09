'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PhotoCropProps {
    isOpen: boolean;
    onClose: () => void;
    imageSrc: string;
    onCrop: (blob: Blob) => void;
}

type AspectRatio = 'free' | '1:1' | '3:4';

const ASPECT_RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
    { label: 'Libre', value: 'free' },
    { label: 'Cuadrado', value: '1:1', ratio: 1 },
    { label: 'Vertical', value: '3:4', ratio: 3 / 4 },
];

export function PhotoCrop({ isOpen, onClose, imageSrc, onCrop }: PhotoCropProps) {
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const [touchId, setTouchId] = useState<number | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const displayInfoRef = useRef({ offsetX: 0, offsetY: 0, scale: 1 });

    const currentRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio);

    useEffect(() => {
        if (!isOpen) return;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            imageRef.current = img;
            const container = containerRef.current;
            if (!container) return;

            const containerW = container.clientWidth;
            const containerH = 300;
            const scale = Math.min(containerW / img.width, containerH / img.height);
            const displayW = img.width * scale;
            const displayH = img.height * scale;
            const offsetX = (containerW - displayW) / 2;
            const offsetY = (containerH - displayH) / 2;

            displayInfoRef.current = { offsetX, offsetY, scale };

            let cropW: number, cropH: number;
            if (currentRatio?.ratio) {
                if (displayW / displayH > currentRatio.ratio) {
                    cropH = displayH * 0.8;
                    cropW = cropH * currentRatio.ratio;
                } else {
                    cropW = displayW * 0.8;
                    cropH = cropW / currentRatio.ratio;
                }
            } else {
                cropW = displayW * 0.8;
                cropH = displayH * 0.8;
            }

            setCropBox({
                x: offsetX + (displayW - cropW) / 2,
                y: offsetY + (displayH - cropH) / 2,
                width: cropW,
                height: cropH,
            });
        };
        img.src = imageSrc;
    }, [isOpen, imageSrc, aspectRatio, currentRatio]);

    const getClientPos = (e: React.MouseEvent | React.TouchEvent): { clientX: number; clientY: number } | null => {
        if ('touches' in e) {
            const touch = e.touches[0] || (e as React.TouchEvent).changedTouches[0];
            if (!touch) return null;
            return { clientX: touch.clientX, clientY: touch.clientY };
        }
        return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY };
    };

    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - cropBox.x, y: clientY - cropBox.y });
    }, [cropBox]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (!isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        let newX = clientX - dragStart.x;
        let newY = clientY - dragStart.y;
        const containerW = container.clientWidth;
        const containerH = 300;

        newX = Math.max(0, Math.min(newX, containerW - cropBox.width));
        newY = Math.max(0, Math.min(newY, containerH - cropBox.height));

        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    }, [isDragging, dragStart, cropBox.width, cropBox.height]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setTouchId(null);
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        const pos = getClientPos(e);
        if (pos) handleDragStart(pos.clientX, pos.clientY);
    }, [handleDragStart]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const pos = getClientPos(e);
        if (pos) handleDragMove(pos.clientX, pos.clientY);
    }, [handleDragMove]);

    const handleMouseUp = useCallback(() => {
        handleDragEnd();
    }, [handleDragEnd]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        const pos = getClientPos(e);
        if (pos) {
            setTouchId(e.touches[0].identifier);
            handleDragStart(pos.clientX, pos.clientY);
        }
    }, [handleDragStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchId === null) return;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                handleDragMove(e.touches[i].clientX, e.touches[i].clientY);
                break;
            }
        }
    }, [handleDragMove, touchId]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        handleDragEnd();
    }, [handleDragEnd]);

    const handleCrop = useCallback(async () => {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas) return;

        setLoading(true);

        const { offsetX, offsetY, scale } = displayInfoRef.current;

        const actualX = (cropBox.x - offsetX) / scale;
        const actualY = (cropBox.y - offsetY) / scale;
        const actualW = cropBox.width / scale;
        const actualH = cropBox.height / scale;

        canvas.width = actualW;
        canvas.height = actualH;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            img,
            actualX,
            actualY,
            actualW,
            actualH,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob((blob) => {
            if (blob) {
                onCrop(blob);
            }
            setLoading(false);
            onClose();
        }, 'image/jpeg', 0.9);
    }, [cropBox, onCrop, onClose]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recortar foto</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex gap-2 justify-center">
                        {ASPECT_RATIOS.map((ar) => (
                            <Button
                                key={ar.value}
                                variant={aspectRatio === ar.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setAspectRatio(ar.value)}
                            >
                                {ar.label}
                            </Button>
                        ))}
                    </div>

                    <div
                        ref={containerRef}
                        className="relative bg-black rounded-lg overflow-hidden select-none touch-none"
                        style={{ height: 300 }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {imageSrc && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageSrc}
                                alt="Crop preview"
                                className="w-full h-full object-contain"
                                draggable={false}
                            />
                        )}
                        <div
                            className="absolute border-2 border-white cursor-move"
                            style={{
                                left: cropBox.x,
                                top: cropBox.y,
                                width: cropBox.width,
                                height: cropBox.height,
                            }}
                            onMouseDown={handleMouseDown}
                            onTouchStart={(e) => { e.stopPropagation(); handleTouchStart(e); }}
                        >
                            <div className="absolute inset-0 border border-white/30" />
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white -translate-x-1 -translate-y-1" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white translate-x-1 -translate-y-1" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white -translate-x-1 translate-y-1" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white translate-x-1 translate-y-1" />
                        </div>
                    </div>

                    <canvas ref={canvasRef} className="hidden" />
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button onClick={handleCrop} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
