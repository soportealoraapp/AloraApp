'use client';

import { VoiceEmotion } from '@/audio/emotion/detectEmotion';
import { Badge } from '@/components/ui/badge';
import { Smile, Zap } from 'lucide-react';

export function AudioInsights({ emotion }: { emotion: VoiceEmotion }) {
    if (!emotion) return null;

    const emotionConfig = {
        joy: { label: 'Alegre', color: 'bg-yellow-100 text-yellow-700' },
        enthusiasm: { label: 'Entusiasta', color: 'bg-purple-100 text-purple-700' },
        sadness: { label: 'Melancólico', color: 'bg-blue-100 text-blue-700' },
        curiosity: { label: 'Curioso', color: 'bg-green-100 text-green-700' },
        neutral: { label: 'Neutral', color: 'bg-gray-100 text-gray-700' }
    };

    const current = emotionConfig[emotion.primaryEmotion] || emotionConfig.neutral;

    return (
        <div className="flex gap-2 mt-2">
            <Badge variant="outline" className={`${current.color} border-none flex items-center gap-1`}>
                <Smile size={12} /> {current.label}
            </Badge>
            {emotion.arousal > 0.6 && (
                <Badge variant="outline" className="bg-red-50 text-red-600 border-none flex items-center gap-1">
                    <Zap size={12} /> Energía Alta
                </Badge>
            )}
        </div>
    );
}
