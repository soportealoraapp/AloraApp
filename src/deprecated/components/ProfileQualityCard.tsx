'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles, ArrowRight } from 'lucide-react';

interface ProfileQualityCardProps {
    score: number;
    recommendations: { text: string; impact: number; category: string }[];
    onNavigate?: (category: string) => void;
}

export function ProfileQualityCard({ score, recommendations, onNavigate }: ProfileQualityCardProps) {
    const getColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-orange-600';
    };

    const getMessage = (score: number) => {
        if (score >= 90) return 'Tu perfil es excelente';
        if (score >= 70) return 'Tu perfil está en buen camino';
        if (score >= 50) return 'Tu perfil tiene potencial';
        return 'Tu perfil necesita atención';
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-pink-500" />
                        Calidad de Perfil
                    </CardTitle>
                    <span className={`text-2xl font-bold ${getColor(score)}`}>{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
                <p className="text-xs text-muted-foreground">{getMessage(score)}</p>
            </CardHeader>
            {recommendations.length > 0 && (
                <CardContent className="pt-0">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Mejoras sugeridas</h4>
                    <ul className="space-y-2">
                        {recommendations.slice(0, 3).map((rec, i) => (
                            <li
                                key={i}
                                className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => onNavigate?.(rec.category)}
                            >
                                <span className="flex-1">{rec.text}</span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground ml-2" />
                            </li>
                        ))}
                    </ul>
                </CardContent>
            )}
        </Card>
    );
}
