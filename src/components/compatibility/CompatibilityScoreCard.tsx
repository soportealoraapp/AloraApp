'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Sparkles } from 'lucide-react';

interface CompatibilityScoreCardProps {
    score: number;
    explanation: string[];
    dimensions?: Record<string, number>;
    sharedItems?: {
        values: string[];
        interests: string[];
        music: string[];
        lifestyle: string[];
    };
    differences?: {
        values: string[];
        lifestyle: string[];
    };
}

const dimensionLabels: Record<string, string> = {
    values: 'Valores',
    relationshipGoals: 'Objetivos',
    personality: 'Personalidad',
    quizzes: 'Quizzes',
    interests: 'Intereses',
    lifestyle: 'Estilo de vida',
};

export function CompatibilityScoreCard({ score, explanation, dimensions, sharedItems, differences }: CompatibilityScoreCardProps) {
    const allShared = [
        ...(sharedItems?.values || []).map(v => `Valoran ${v}`),
        ...(sharedItems?.interests || []).map(i => `Les gusta ${i}`),
        ...(sharedItems?.music || []).map(m => `Escuchan ${m}`),
        ...(sharedItems?.lifestyle || []),
    ];

    const allDifferences = [
        ...(differences?.values || []).map(v => `Valor diferente: ${v}`),
        ...(differences?.lifestyle || []),
    ];

    return (
        <Card className="overflow-hidden border-none shadow-lg">
            <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 p-6 text-white text-center">
                <Sparkles className="h-8 w-8 mx-auto mb-2 fill-white" />
                <h3 className="text-lg font-bold mb-1">Compatibilidad</h3>
                <div className="text-5xl font-bold">{score}%</div>
                <Progress value={score} className="mt-3 h-2 bg-white/30" />
            </div>
            <CardContent className="p-6 space-y-4">
                {dimensions && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {Object.entries(dimensions).map(([key, val]) => (
                            <div key={key} className="text-center p-2 rounded-lg bg-muted/50">
                                <div className="text-xs text-muted-foreground">{dimensionLabels[key] || key}</div>
                                <div className="font-bold text-sm">{val}%</div>
                            </div>
                        ))}
                    </div>
                )}

                {allShared.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">¿Por qué son compatibles?</h4>
                        <p className="text-xs text-muted-foreground">Porque ambos:</p>
                        <ul className="space-y-1">
                            {allShared.map((item, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {allDifferences.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <h4 className="font-semibold text-sm text-muted-foreground">Posibles diferencias</h4>
                        <ul className="space-y-1">
                            {allDifferences.map((item, i) => (
                                <li key={i} className="text-sm flex items-start gap-2 text-muted-foreground">
                                    <span className="mt-0.5">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {explanation.length > 0 && allShared.length === 0 && (
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">Por qué conectan</h4>
                        <ul className="space-y-1">
                            {explanation.map((line, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 mt-0.5">✓</span>
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
