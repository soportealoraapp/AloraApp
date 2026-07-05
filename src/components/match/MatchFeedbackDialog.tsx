'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, X, Heart, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface MatchFeedbackDialogProps {
    matchId: string;
    partnerName: string;
    open: boolean;
    onClose: () => void;
    onSubmitted?: () => void;
}

const RATING_LABELS: Record<number, string> = {
    1: 'No fue buena conexión',
    2: 'Podría mejorar',
    3: 'Estuvo bien',
    4: 'Buena experiencia',
    5: '¡Excelente match!',
};

export function MatchFeedbackDialog({ matchId, partnerName, open, onClose, onSubmitted }: MatchFeedbackDialogProps) {
    const { toast } = useToast();
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!open) return null;

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({ title: 'Selecciona una calificación', variant: 'destructive' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/match/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, rating, comment: comment.trim() || null }),
            });

            if (res.ok) {
                toast({ title: '¡Gracias por tu feedback! 💜' });
                onSubmitted?.();
                onClose();
            } else {
                throw new Error();
            }
        } catch (error) {
            toast({ title: 'Error al enviar', variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={`Feedback sobre ${partnerName}`}>
            <Card className="w-full max-w-md rounded-3xl">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Heart className="h-5 w-5 text-primary fill-primary" />
                            <h2 className="font-bold text-lg">¿Qué tal con {partnerName}?</h2>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11" aria-label="Cerrar">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Tu feedback es anónimo y nos ayuda a mejorar tus futuras conexiones.
                    </p>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold text-center">¿Qué tan buena fue la conexión?</p>
                        <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <button
                                    key={n}
                                    onMouseEnter={() => setHovered(n)}
                                    onMouseLeave={() => setHovered(0)}
                                    onClick={() => setRating(n)}
                                    className="p-1.5 transition-transform hover:scale-110 min-h-[44px] min-w-[44px] flex items-center justify-center"
                                    type="button"
                                    aria-label={n + ' estrella' + (n > 1 ? 's' : '')}
                                >
                                    <Star
                                        className={`h-9 w-9 transition-colors ${(hovered || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/50'}`}
                                    />
                                </button>
                            ))}
                        </div>
                        {(hovered || rating) > 0 && (
                            <p className="text-center text-xs font-medium text-amber-600 dark:text-amber-400">
                                {RATING_LABELS[hovered || rating]}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Comentario (opcional)</p>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="¿Algo que destacarías?"
                            rows={3}
                            maxLength={500}
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            Más tarde
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="flex-1">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
                            Enviar
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
