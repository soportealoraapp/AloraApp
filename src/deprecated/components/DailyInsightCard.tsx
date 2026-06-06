'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Lightbulb, MessageCircle, Heart, Brain, Sparkles } from 'lucide-react';

interface DailyInsight {
    reflection: string;
    personalQuestion: string;
    relationalInsight: string;
    conversationTip: string;
    emotionalTip: string;
}

interface DailyInsightCardProps {
    insight: DailyInsight | null;
    loading?: boolean;
}

const sections = [
    { key: 'reflection', icon: Brain, label: 'Reflexión del día', color: 'text-purple-500' },
    { key: 'personalQuestion', icon: Lightbulb, label: 'Pregunta personal', color: 'text-yellow-500' },
    { key: 'relationalInsight', icon: Heart, label: 'Insight relacional', color: 'text-pink-500' },
    { key: 'conversationTip', icon: MessageCircle, label: 'Consejo de conversación', color: 'text-blue-500' },
    { key: 'emotionalTip', icon: Sparkles, label: 'Consejo emocional', color: 'text-green-500' },
];

export function DailyInsightCard({ insight, loading }: DailyInsightCardProps) {
    if (loading) {
        return (
            <Card className="border-dashed">
                <CardContent className="p-6">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-1/3" />
                        <div className="h-3 bg-muted rounded w-full" />
                        <div className="h-3 bg-muted rounded w-2/3" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!insight) return null;

    return (
        <Card className="overflow-hidden border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50">
            <CardContent className="p-5 space-y-4">
                <h3 className="font-bold text-pink-700 flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Hoy para ti
                </h3>
                <div className="space-y-3">
                    {sections.map(({ key, icon: Icon, label, color }) => (
                        <div key={key} className="flex items-start gap-3">
                            <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${color}`} />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                                <p className="text-sm">{(insight as any)[key]}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
