'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dice1, RefreshCw, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationRouletteProps {
    onSend: (question: string) => void;
    disabled?: boolean;
}

const QUESTIONS = {
    deep: [
        "¿Qué experiencia te cambió la vida?",
        "¿Cuál es tu mayor miedo y por qué?",
        "¿Qué es lo que más valoras en una amistad?",
        "Si pudieras cenar con alguien (vivo o muerto), ¿quién sería?",
        "¿Cuál es el consejo más importante que te han dado?",
        "¿Qué significa para ti ser vulnerable?",
        "¿Cuál fue el momento más difícil que has superado?",
        "Si pudieras darle un consejo a tu yo del pasado, ¿cuál sería?",
    ],
    fun: [
        "¿Cuál es tu placer culpable musical?",
        "Si tu vida fuera una película, ¿quién te interpretaría?",
        "¿Cuál es la cosa más rara que te gusta?",
        "Si pudieras tener un superpoder, ¿cuál sería?",
        "¿Cuál fue tu peor cita?",
        "Si pudieras vivir en cualquier época, ¿cuándo elegirías?",
        "¿Cuál es tu emoji más usado?",
        "¿Qué harías si ganaras 10 millones mañana?",
    ],
    romantic: [
        "¿Cuál fue tu momento 'me gustó' más inesperado?",
        "¿Qué pequeño detalle te enamora de alguien?",
        "¿Cómo imaginas una tarde perfecta con alguien especial?",
        "¿Qué canción describes tu vida amorosa?",
        "¿Cuál es tu favorita forma de recibir un halago?",
        "¿Qué valoras más en una primera cita?",
        "¿Cómo te gusta que te demuestren afecto?",
        "¿Cuál ha sido tu mejor momento en una relación?",
    ],
    hypothetical: [
        "¿Qué harías si tuvieras 24 horas extra por semana?",
        "Si pudieras teletransportarte ahora mismo, ¿a dónde irías?",
        "Si pudieras dominar una habilidad instantáneamente, ¿cuál sería?",
        "Si pudieras hablar con los animales, ¿qué les preguntarías?",
        "Si pudieras revivir un día de tu vida, ¿cuál elegirías?",
        "Si pudieras crear una ley, ¿cuál sería?",
        "Si pudieras tener una cena con tu yo del futuro, ¿qué le preguntarías?",
        "Si pudieras vivir sin una cosa, ¿qué eliminarías?",
    ],
};

type Category = keyof typeof QUESTIONS;

const CATEGORY_LABELS: Record<Category, { label: string; color: string }> = {
    deep: { label: 'Profunda', color: 'text-purple-500' },
    fun: { label: 'Divertida', color: 'text-orange-500 dark:text-orange-400' },
    romantic: { label: 'Romántica', color: 'text-pink-500' },
    hypothetical: { label: 'Hipotética', color: 'text-blue-500' },
};

export function ConversationRoulette({ onSend, disabled }: ConversationRouletteProps) {
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [currentCategory, setCurrentCategory] = useState<Category>('deep');
    const [isSpinning, setIsSpinning] = useState(false);

    const spin = () => {
        setIsSpinning(true);
        const categories: Category[] = ['deep', 'fun', 'romantic', 'hypothetical'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const randomQuestion = QUESTIONS[randomCategory][
            Math.floor(Math.random() * QUESTIONS[randomCategory].length)
        ];

        setTimeout(() => {
            setCurrentCategory(randomCategory);
            setCurrentQuestion(randomQuestion);
            setIsSpinning(false);
        }, 800);
    };

    const handleSend = () => {
        if (currentQuestion) {
            onSend(currentQuestion);
            setCurrentQuestion(null);
        }
    };

    return (
        <div className="space-y-2">
            {currentQuestion ? (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Sparkles className={cn("h-3 w-3", CATEGORY_LABELS[currentCategory].color)} />
                                    <span className={cn("text-xs font-bold uppercase", CATEGORY_LABELS[currentCategory].color)}>
                                        {CATEGORY_LABELS[currentCategory].label}
                                    </span>
                                </div>
                                <p className="text-sm font-medium leading-snug">{currentQuestion}</p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={spin}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                                <Button size="icon" className="h-8 w-8" onClick={handleSend}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={spin}
                    disabled={disabled || isSpinning}
                    className="w-full"
                >
                    <Dice1 className={cn("h-4 w-4 mr-2", isSpinning && "animate-spin")} />
                    {isSpinning ? 'Buscando...' : '🎲 Pregunta aleatoria'}
                </Button>
            )}
        </div>
    );
}
