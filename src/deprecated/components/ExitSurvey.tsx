'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Frown, Users, MessageCircle, Heart, HelpCircle } from 'lucide-react';

interface ExitSurveyProps {
    onClose: () => void;
}

const reasons = [
    { id: 'few_people', label: 'Pocas personas en mi zona', icon: Users },
    { id: 'few_matches', label: 'Pocos matches', icon: Frown },
    { id: 'few_replies', label: 'Pocas respuestas', icon: MessageCircle },
    { id: 'found_partner', label: 'Encontré pareja', icon: Heart },
    { id: 'other', label: 'Otro motivo', icon: HelpCircle },
];

export function ExitSurvey({ onClose }: ExitSurveyProps) {
    const [selected, setSelected] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!selected) return;
        try {
            await fetch('/api/feedback/exit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: selected }),
            });
            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting exit survey:', error);
        }
    };

    if (submitted) {
        return (
            <Card className="max-w-md mx-auto">
                <CardContent className="p-6 text-center">
                    <p className="font-medium">Gracias por tu feedback</p>
                    <p className="text-sm text-muted-foreground mt-1">Tu opinión nos ayuda a mejorar</p>
                    <Button variant="outline" className="mt-4" onClick={onClose}>Cerrar</Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">¿Cómo ha sido tu experiencia?</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">Tu feedback es anónimo y nos ayuda a mejorar Alora</p>
                {reasons.map((reason) => (
                    <div
                        key={reason.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            selected === reason.id ? 'border-primary bg-primary/5' : 'border-muted hover:bg-muted/50'
                        }`}
                        onClick={() => setSelected(reason.id)}
                    >
                        <reason.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">{reason.label}</span>
                    </div>
                ))}
                <Button className="w-full" onClick={handleSubmit} disabled={!selected}>
                    Enviar feedback
                </Button>
            </CardContent>
        </Card>
    );
}
