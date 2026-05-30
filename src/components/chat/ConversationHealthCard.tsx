'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, AlertTriangle, Clock, MessageCircle, TrendingDown } from 'lucide-react';

interface ConversationHealthProps {
    status: string;
    score: number;
    indicators: { label: string; value: string; positive: boolean }[];
    suggestions: string[];
}

const statusConfig = {
    thriving: { label: 'Excelente', color: 'bg-green-100 text-green-700', icon: Heart },
    healthy: { label: 'Saludable', color: 'bg-blue-100 text-blue-700', icon: MessageCircle },
    fading: { label: 'Enfriándose', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    stale: { label: 'Estancada', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    ghosting: { label: 'Sin respuesta', color: 'bg-red-100 text-red-700', icon: TrendingDown },
};

export function ConversationHealthCard({ status, score, indicators, suggestions }: ConversationHealthProps) {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.stale;
    const Icon = config.icon;

    return (
        <Card className="overflow-hidden">
            <div className={`p-3 ${config.color.split(' ')[0]} bg-opacity-50`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">Salud de la conversación</span>
                    </div>
                    <Badge className={`${config.color} font-bold`}>{config.label}</Badge>
                </div>
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    {indicators.map((ind, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{ind.label}</p>
                            <p className={`text-sm font-medium ${ind.positive ? 'text-green-600' : 'text-orange-600'}`}>
                                {ind.value}
                            </p>
                        </div>
                    ))}
                </div>
                {suggestions.length > 0 && (
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Sugerencias</p>
                        {suggestions.map((s, i) => (
                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                                <span className="text-pink-500">→</span> {s}
                            </p>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
