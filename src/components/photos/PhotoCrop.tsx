'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ZoomIn, ZoomOut } from 'lucide-react';

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

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'r' | 'b' | 'l';

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
    tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize',
    t: 'n-resize', r: 'e-resize', b: 's-resize', l: 'w-resize',
};

export function PhotoCrop({ isOpen, onClose, imageSrc, onCrop }: PhotoCropProps) {
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('3:4');
    const [cropBox, setCropBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [loading, setLoading] = useState(false);
    const [touchId, setTouchId] = useState<number | null>(null);
    const [zoom, setZoom] = useState(1);
    const [resizing, setResizing] = useState<ResizeHandle | null>(null);
    const [pinchDist, setPinchDist] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const displayInfoRef = useRef({ offsetX: 0, offsetY: 0, scale: 1, containerW: 0, containerH: 300 });

    const currentRatio = ASPECT_RATIOS.find(r => r.value === aspectRatio);

    useEffect(() => {
        if (!isOpen) return;
        setZoom(1);
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

            displayInfoRef.current = { offsetX, offsetY, scale, containerW, containerH };

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

    const clampBox = useCallback((box: { x: number; y: number; width: number; height: number }) => {
        const { containerW, containerH } = displayInfoRef.current;
        const minSize = 30;
        return {
            x: Math.max(0, Math.min(box.x, containerW - minSize)),
            y: Math.max(0, Math.min(box.y, containerH - minSize)),
            width: Math.max(minSize, Math.min(box.width, containerW)),
            height: Math.max(minSize, Math.min(box.height, containerH)),
        };
    }, []);

    const handleDragStart = useCallback((clientX: number, clientY: number) => {
        setIsDragging(true);
        setDragStart({ x: clientX - cropBox.x, y: clientY - cropBox.y });
    }, [cropBox]);

    const handleDragMove = useCallback((clientX: number, clientY: number) => {
        if (isDragging) {
            const container = containerRef.current;
            if (!container) return;
            let newX = clientX - dragStart.x;
            let newY = clientY - dragStart.y;
            const containerW = container.clientWidth;
            const containerH = 300;
            newX = Math.max(0, Math.min(newX, containerW - cropBox.width));
            newY = Math.max(0, Math.min(newY, containerH - cropBox.height));
            setCropBox(prev => clampBox({ ...prev, x: newX, y: newY }));
        }
        if (resizing) {
            const container = containerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const mx = clientX - rect.left;
            const my = clientY - rect.top;
            const ratio = currentRatio?.ratio;
            const minSize = 30;

            setCropBox(prev => {
                let { x, y, width, height } = prev;
                switch (resizing) {
                    case 'br':
                        width = Math.max(minSize, mx - x);
                        if (ratio) height = width / ratio;
                        break;
                    case 'bl':
                        width = Math.max(minSize, x + prev.width - mx);
                        if (ratio) { height = width / ratio; x = mx; }
                        else { x = mx; }
                        break;
                    case 'tr':
                        width = Math.max(minSize, mx - x);
                        if (ratio) { height = width / ratio; y = my; }
                        break;
                    case 'tl':
                        width = Math.max(minSize, x + prev.width - mx);
                        if (ratio) { height = width / ratio; x = mx; y = my; }
                        else { x = mx; y = my; }
                        break;
                    case 't':
                        height = Math.max(minSize, prev.height + prev.y - my);
                        y = my;
                        if (ratio) width = height * ratio;
                        break;
                    case 'b':
                        height = Math.max(minSize, my - y);
                        if (ratio) width = height * ratio;
                        break;
                    case 'l':
                        width = Math.max(minSize, prev.width + prev.x - mx);
                        x = mx;
                        if (ratio) height = width / ratio;
                        break;
                    case 'r':
                        width = Math.max(minSize, mx - x);
                        if (ratio) height = width / ratio;
                        break;
                }
                return clampBox({ x, y, width, height });
            });
        }
    }, [isDragging, dragStart, cropBox, resizing, currentRatio, clampBox]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
        setResizing(null);
        setTouchId(null);
        setPinchDist(0);
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
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            setPinchDist(Math.sqrt(dx * dx + dy * dy));
            return;
        }
        const pos = getClientPos(e);
        if (pos) {
            setTouchId(e.touches[0].identifier);
            handleDragStart(pos.clientX, pos.clientY);
        }
    }, [handleDragStart]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchDist > 0) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const delta = dist - pinchDist;
            if (Math.abs(delta) > 10) {
                setZoom(prev => Math.max(1, Math.min(3, prev + (delta > 0 ? 0.1 : -0.1))));
                setPinchDist(dist);
            }
            return;
        }
        if (touchId === null) return;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === touchId) {
                handleDragMove(e.touches[i].clientX, e.touches[i].clientY);
                break;
            }
        }
    }, [handleDragMove, touchId, pinchDist]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        handleDragEnd();
    }, [handleDragEnd]);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        setZoom(prev => Math.max(1, Math.min(3, prev + delta)));
    }, []);

    const handleResizeStart = useCallback((handle: ResizeHandle) => (e: React.MouseEvent) => {
        e.stopPropagation();
        setResizing(handle);
    }, []);

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

    const renderResizeHandle = (handle: ResizeHandle) => {
        const positions: Record<ResizeHandle, { style: React.CSSProperties }> = {
            tl: { style: { top: -4, left: -4, cursor: HANDLE_CURSORS.tl } },
            tr: { style: { top: -4, right: -4, cursor: HANDLE_CURSORS.tr } },
            bl: { style: { bottom: -4, left: -4, cursor: HANDLE_CURSORS.bl } },
            br: { style: { bottom: -4, right: -4, cursor: HANDLE_CURSORS.br } },
            t: { style: { top: -4, left: '50%', marginLeft: -4, cursor: HANDLE_CURSORS.t } },
            r: { style: { right: -4, top: '50%', marginTop: -4, cursor: HANDLE_CURSORS.r } },
            b: { style: { bottom: -4, left: '50%', marginLeft: -4, cursor: HANDLE_CURSORS.b } },
            l: { style: { left: -4, top: '50%', marginTop: -4, cursor: HANDLE_CURSORS.l } },
        };
        const pos = positions[handle];
        return (
            <div
                key={handle}
                onMouseDown={handleResizeStart(handle)}
                className="absolute w-2.5 h-2.5 bg-white border-2 border-primary rounded-sm shadow z-20"
                style={pos.style}
            />
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Recortar foto</DialogTitle>
                    <DialogDescription className="sr-only">Ajusta el área de recorte de tu foto</DialogDescription>
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

                    <div className="flex items-center gap-2 justify-center">
                        <ZoomOut className="h-4 w-4 text-muted-foreground" />
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-32 accent-primary"
                        />
                        <ZoomIn className="h-4 w-4 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(zoom * 100)}%</span>
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
                        onWheel={handleWheel}
                    >
                        {imageSrc && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageSrc}
                                alt="Crop preview"
                                className="w-full h-full object-contain"
                                draggable={false}
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
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
                            {(['tl', 'tr', 'bl', 'br', 't', 'r', 'b', 'l'] as ResizeHandle[]).map(renderResizeHandle)}
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
