'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Video, MapPin, Heart } from 'lucide-react';

interface DateSignalPromptProps {
    matchId: string;
    partnerName: string;
    onSignalSent?: () => void;
}

const signals = [
    { type: 'still_talking', label: 'Seguimos hablando', icon: MessageCircle, color: 'text-blue-500' },
    { type: 'video_call', label: 'Videollamamos', icon: Video, color: 'text-purple-500' },
    { type: 'date', label: 'Nos vimos en persona', icon: MapPin, color: 'text-green-500' },
    { type: 'dating', label: 'Estamos saliendo', icon: Heart, color: 'text-pink-500' },
];

export function DateSignalPrompt({ matchId, partnerName, onSignalSent }: DateSignalPromptProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const handleSelect = async (type: string) => {
        setSelected(type);
        try {
            await fetch('/api/date-signal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, type }),
            });
            setSent(true);
            onSignalSent?.();
        } catch (error) {
            console.error('Error sending date signal:', error);
        }
    };

    if (sent) {
        return (
            <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                    <p className="text-sm text-green-700 font-medium">¡Gracias por compartir!</p>
                    <p className="text-xs text-green-600">Tu feedback nos ayuda a mejorar</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-dashed">
            <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-3">
                    ¿Cómo va con {partnerName}?
                </p>
                <div className="flex flex-wrap gap-2">
                    {signals.map((signal) => (
                        <Badge
                            key={signal.type}
                            variant={selected === signal.type ? 'default' : 'outline'}
                            className="cursor-pointer hover:bg-primary/10"
                            onClick={() => handleSelect(signal.type)}
                        >
                            <signal.icon className={`h-3 w-3 mr-1 ${signal.color}`} />
                            {signal.label}
                        </Badge>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
