'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Loader2, Check, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DailyQuestionData {
    question: string;
    category: string;
    questionId: string;
    userAnswer: string | null;
    answered: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
    values: 'Valores',
    goals: 'Metas',
    communication: 'Comunicacion',
    connection: 'Conexion',
    lifestyle: 'Estilo de vida',
    growth: 'Crecimiento',
    dating: 'Citas',
    personality: 'Personalidad',
};

export function DailyQuestionCard() {
    const { toast } = useToast();
    const [data, setData] = useState<DailyQuestionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(false);
    const [answer, setAnswer] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        fetchQuestion();
    }, []);

    const fetchQuestion = async () => {
        try {
            setFetchError(false);
            const res = await fetch('/api/daily-question');
            if (!res.ok) throw new Error('Failed to fetch');
            const result = await res.json();
            setData(result);
            if (result.userAnswer) {
                setAnswer(result.userAnswer);
            }
        } catch (error) {
            console.error('Error fetching daily question:', error);
            setFetchError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!answer.trim() || !data) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/daily-question', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionId: data.questionId, answer: answer.trim() })
            });

            if (!res.ok) throw new Error('Error al guardar respuesta');

            toast({ title: 'Respuesta guardada', description: 'Tu respuesta ya influye en tu compatibilidad y se ve en tu perfil.' });
            setData({ ...data, userAnswer: answer.trim(), answered: true });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="py-8 flex justify-center">
                    <Loader2 className="animate-spin text-pink-500 h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (fetchError) {
        return (
            <Card>
                <CardContent className="py-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">No se pudo cargar la pregunta del día</p>
                    <Button size="sm" variant="outline" onClick={fetchQuestion}>
                        Reintentar
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!data) return null;

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-pink-500" />
                        Pregunta del día
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                        {CATEGORY_LABELS[data.category] || data.category}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                    {data.question}
                </p>

                {data.answered && !editing ? (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-start gap-2">
                            <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="text-xs font-medium text-green-800 mb-1">Tu respuesta:</p>
                                <p className="text-sm text-green-700">{data.userAnswer}</p>
                            </div>
                            <button
                                onClick={() => setEditing(true)}
                                className="text-[10px] font-medium text-green-600 hover:underline shrink-0 mt-0.5"
                            >
                                Editar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Textarea
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            placeholder="Comparte tu respuesta..."
                            className="min-h-[80px] resize-none text-sm"
                            maxLength={300}
                        />
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-muted-foreground">
                                {answer.length}/300
                            </span>
                            <div className="flex items-center gap-2">
                                {editing && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditing(false);
                                            setAnswer(data?.userAnswer || '');
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    onClick={handleSubmit}
                                    disabled={!answer.trim() || submitting}
                                    className="bg-gradient-to-r from-pink-500 to-rose-400"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin h-3 w-3 mr-1" />
                                    ) : (
                                        <Send className="h-3 w-3 mr-1" />
                                    )}
                                    {editing ? 'Actualizar' : 'Enviar'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
