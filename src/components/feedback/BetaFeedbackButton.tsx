'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, X, Bug, Lightbulb, Shield, Send } from 'lucide-react';

const categories = [
    { id: 'bug', label: 'Error', icon: Bug },
    { id: 'ux', label: 'Mejora UX', icon: Lightbulb },
    { id: 'safety', label: 'Seguridad', icon: Shield },
    { id: 'other', label: 'Otro', icon: MessageSquare },
];

export function BetaFeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!category || !description) return;
        try {
            await fetch('/api/feedback/beta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category, description }),
            });
            setSubmitted(true);
            setTimeout(() => {
                setIsOpen(false);
                setSubmitted(false);
                setCategory('');
                setDescription('');
            }, 2000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-20 right-4 rounded-full shadow-lg z-50"
                size="icon"
                onClick={() => setIsOpen(true)}
            >
                <MessageSquare className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-20 right-4 w-80 shadow-xl z-50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Feedback Beta</CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="space-y-3">
                {submitted ? (
                    <p className="text-sm text-green-600 text-center">¡Gracias por tu feedback!</p>
                ) : (
                    <>
                        <div className="flex gap-2">
                            {categories.map((cat) => (
                                <Badge
                                    key={cat.id}
                                    variant={category === cat.id ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => setCategory(cat.id)}
                                >
                                    <cat.icon className="h-3 w-3 mr-1" />
                                    {cat.label}
                                </Badge>
                            ))}
                        </div>
                        <textarea
                            className="w-full p-2 text-sm border rounded-lg resize-none"
                            rows={3}
                            placeholder="Describe tu feedback..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <Button className="w-full" size="sm" onClick={handleSubmit} disabled={!category || !description}>
                            <Send className="h-3 w-3 mr-2" /> Enviar
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
