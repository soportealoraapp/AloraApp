'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { getTrustBadgeColor } from '@/server/services/trust-score';

interface TrustScoreCardProps {
    score: number;
    level: string;
    reasons: string[];
    improvementTips: string[];
    showDetails?: boolean;
}

export function TrustScoreCard({ score, level, reasons, improvementTips, showDetails = true }: TrustScoreCardProps) {
    const badgeColor = getTrustBadgeColor(level);

    return (
        <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <span className="font-bold">Trust Score</span>
                    </div>
                    <Badge className={`${badgeColor} font-bold`}>{level}</Badge>
                </div>
                <div className="mt-3">
                    <div className="text-3xl font-bold">{score}/100</div>
                    <Progress value={score} className="mt-2 h-2 bg-white/30" />
                </div>
            </div>

            {showDetails && (
                <CardContent className="p-4 space-y-4">
                    {reasons.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-green-600 flex items-center gap-1 mb-2">
                                <CheckCircle className="h-4 w-4" /> Fortalezas
                            </h4>
                            <ul className="space-y-1">
                                {reasons.map((r, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-green-500 mt-0.5">✓</span> {r}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {improvementTips.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-orange-600 flex items-center gap-1 mb-2">
                                <TrendingUp className="h-4 w-4" /> Mejoras sugeridas
                            </h4>
                            <ul className="space-y-1">
                                {improvementTips.map((t, i) => (
                                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-orange-500 mt-0.5">→</span> {t}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            )}
        </Card>
    );
}
