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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

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
                x: (containerW - cropW) / 2,
                y: (containerH - cropH) / 2,
                width: cropW,
                height: cropH,
            });
        };
        img.src = imageSrc;
    }, [isOpen, imageSrc, aspectRatio, currentRatio]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - cropBox.x, y: e.clientY - cropBox.y });
    }, [cropBox]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isDragging) return;
        const container = containerRef.current;
        if (!container) return;

        let newX = e.clientX - dragStart.x;
        let newY = e.clientY - dragStart.y;

        newX = Math.max(0, Math.min(newX, container.clientWidth - cropBox.width));
        newY = Math.max(0, Math.min(newY, 300 - cropBox.height));

        setCropBox(prev => ({ ...prev, x: newX, y: newY }));
    }, [isDragging, dragStart, cropBox.width, cropBox.height]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleCrop = useCallback(async () => {
        const img = imageRef.current;
        const canvas = canvasRef.current;
        if (!img || !canvas) return;

        setLoading(true);

        const container = containerRef.current;
        if (!container) return;

        const containerW = container.clientWidth;
        const containerH = 300;
        const scaleX = img.width / containerW;
        const scaleY = img.height / containerH;

        canvas.width = cropBox.width * scaleX;
        canvas.height = cropBox.height * scaleY;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(
            img,
            cropBox.x * scaleX,
            cropBox.y * scaleY,
            cropBox.width * scaleX,
            cropBox.height * scaleY,
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
                        className="relative bg-black rounded-lg overflow-hidden select-none"
                        style={{ height: 300 }}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
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
