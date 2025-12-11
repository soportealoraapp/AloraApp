'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

export function CompatibilityScoreCard({ score, explanation }: { score: number, explanation: string[] }) {
    return (
        <Card className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-100">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-pink-500" /> Deep Chemistry
                </h3>
                <span className="text-xl font-black text-pink-600">{score}%</span>
            </div>

            <Progress value={score} className="h-2 mb-4" />

            <div className="space-y-1">
                {explanation.slice(0, 3).map((line, i) => (
                    <p key={i} className="text-xs text-gray-600">{line}</p>
                ))}
            </div>
        </Card>
    );
}
