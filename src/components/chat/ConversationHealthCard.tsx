'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, AlertTriangle, Clock, MessageCircle, TrendingDown, ChevronDown, ChevronUp, Zap, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationHealthProps {
    status: string;
    score: number;
    indicators: { label: string; value: string; positive: boolean }[];
    suggestions: string[];
    energy?: 'high' | 'medium' | 'low';
    balance?: number;
    topics?: string[];
}

const statusConfig = {
    thriving: { label: 'Excelente', color: 'bg-green-100 text-green-700', icon: Heart },
    healthy: { label: 'Saludable', color: 'bg-blue-100 text-blue-700', icon: MessageCircle },
    fading: { label: 'Enfriándose', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    stale: { label: 'Estancada', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    ghosting: { label: 'Sin respuesta', color: 'bg-red-100 text-red-700', icon: TrendingDown },
};

const energyConfig = {
    high: { label: 'Alta', color: 'text-green-600', icon: Zap },
    medium: { label: 'Media', color: 'text-yellow-600', icon: Zap },
    low: { label: 'Baja', color: 'text-red-600', icon: Zap },
};

export function ConversationHealthCard({ status, score, indicators, suggestions, energy, balance, topics }: ConversationHealthProps) {
    const [expanded, setExpanded] = useState(false);
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.stale;
    const Icon = config.icon;
    const energyInfo = energy ? energyConfig[energy] : null;

    return (
        <Card className="overflow-hidden">
            <div className={`p-3 ${config.color.split(' ')[0]} bg-opacity-50`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium text-sm">Salud de la conversación</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`${config.color} font-bold`}>{config.label}</Badge>
                        <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                    {indicators.slice(0, expanded ? undefined : 4).map((ind, i) => (
                        <div key={i} className="text-center p-2 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground">{ind.label}</p>
                            <p className={`text-sm font-medium ${ind.positive ? 'text-green-600' : 'text-orange-600'}`}>
                                {ind.value}
                            </p>
                        </div>
                    ))}
                </div>

                {expanded && (
                    <div className="space-y-3 pt-2 border-t">
                        {energyInfo && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Energía</span>
                                <span className={cn("text-xs font-medium flex items-center gap-1", energyInfo.color)}>
                                    <energyInfo.icon className="h-3 w-3" />
                                    {energyInfo.label}
                                </span>
                            </div>
                        )}

                        {balance !== undefined && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Balance</span>
                                <span className="text-xs font-medium">
                                    {balance < 40 ? 'Tú hablas más' : balance > 60 ? 'El/ella habla más' : 'Equilibrado'}
                                </span>
                            </div>
                        )}

                        {topics && topics.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-1">Temas frecuentes</p>
                                <div className="flex flex-wrap gap-1">
                                    {topics.map((topic, i) => (
                                        <span key={i} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
