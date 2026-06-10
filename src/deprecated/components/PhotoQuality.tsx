'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface PhotoQualityProps {
    src: string;
    onQualityDetected?: (quality: 'excellent' | 'good' | 'needs_improvement') => void;
}

type QualityLevel = 'excellent' | 'good' | 'needs_improvement';

const QUALITY_CONFIG: Record<QualityLevel, { label: string; color: string; icon: typeof CheckCircle }> = {
    excellent: { label: 'Excelente', color: 'bg-green-100 text-green-700', icon: CheckCircle },
    good: { label: 'Buena', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle },
    needs_improvement: { label: 'Mejorable', color: 'bg-red-100 text-red-700', icon: XCircle },
};

function analyzeImage(src: string): Promise<QualityLevel> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve('needs_improvement'); return; }

            const sampleSize = Math.min(img.width, img.height, 200);
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;

            let totalBrightness = 0;
            let pixelCount = 0;
            let skinTonePixels = 0;
            const centerStart = Math.floor(sampleSize * 0.3);
            const centerEnd = Math.floor(sampleSize * 0.7);

            for (let y = 0; y < sampleSize; y++) {
                for (let x = 0; x < sampleSize; x++) {
                    const i = (y * sampleSize + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
                    totalBrightness += brightness;
                    pixelCount++;

                    if (x >= centerStart && x <= centerEnd && y >= centerStart && y <= centerEnd) {
                        if (r > 95 && g > 40 && b > 20 &&
                            r > g && r > b &&
                            Math.abs(r - g) > 15 &&
                            r - Math.min(g, b) > 15) {
                            skinTonePixels++;
                        }
                    }
                }
            }

            const avgBrightness = totalBrightness / pixelCount;
            const centerPixels = (centerEnd - centerStart) * (centerEnd - centerStart);
            const hasFace = skinTonePixels > centerPixels * 0.02;
            const goodBrightness = avgBrightness > 50 && avgBrightness < 220;
            const goodResolution = img.width >= 800 && img.height >= 800;

            let score = 0;
            if (goodResolution) score += 2;
            else if (img.width >= 500) score += 1;

            if (goodBrightness) score += 2;
            else if (avgBrightness > 30 && avgBrightness < 240) score += 1;

            if (hasFace) score += 1;

            if (score >= 4) resolve('excellent');
            else if (score >= 2) resolve('good');
            else resolve('needs_improvement');
        };

        img.onerror = () => resolve('needs_improvement');
        img.src = src;
    });
}

export function PhotoQuality({ src, onQualityDetected }: PhotoQualityProps) {
    const [quality, setQuality] = useState<QualityLevel | null>(null);

    const detect = useCallback(async () => {
        const result = await analyzeImage(src);
        setQuality(result);
        onQualityDetected?.(result);
    }, [src, onQualityDetected]);

    useEffect(() => {
        detect();
    }, [detect]);

    if (!quality) return null;

    const config = QUALITY_CONFIG[quality];
    const Icon = config.icon;

    return (
        <Badge variant="secondary" className={`text-xs py-0 px-1.5 ${config.color}`}>
            <Icon className="h-3 w-3 mr-0.5" />
            {config.label}
        </Badge>
    );
}
