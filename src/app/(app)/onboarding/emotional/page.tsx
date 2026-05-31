'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Sparkles, Heart, Shield, Target, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VALUES } from '@/lib/constants/preferences';

const STEPS = [
    { id: 'goals', title: '¿Qué buscas?', icon: Target },
    { id: 'values', title: '¿Qué valoras?', icon: Heart },
    { id: 'personality', title: '¿Cómo te describes?', icon: Users },
    { id: 'lookingFor', title: '¿Qué buscas en una pareja?', icon: Heart },
    { id: 'avoid', title: '¿Qué quieres evitar?', icon: Shield },
];

const GOALS = ['Relación seria', 'Conocer gente nueva', 'Amistad', 'Ver qué pasa', 'Compañía'];
const PERSONALITY = ['Introvertido/a', 'Extrovertido/a', 'Ambivertido/a', 'Tranquilo/a', 'Energético/a', 'Analítico/a', 'Espontáneo/a'];
const LOOKING_FOR = ['Alguien que me escuche', 'Alguien aventurero/a', 'Alguien tranquilo/a', 'Alguien que me reta', 'Alguien con mismos valores'];
const AVOID = ['Mentiras', 'Juegos mentales', 'Ghosting', 'Falta de respeto', 'Manipulación', 'Superficialidad', 'Celos extremos'];

export default function EmotionalOnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        goals: [] as string[],
        values: [] as string[],
        personality: '',
        lookingFor: '',
        avoid: [] as string[],
    });

    const toggleAnswer = (field: keyof typeof answers, value: string) => {
        setAnswers(prev => {
            const current = prev[field];
            if (Array.isArray(current)) {
                return {
                    ...prev,
                    [field]: current.includes(value)
                        ? current.filter(v => v !== value)
                        : [...current, value]
                };
            }
            return { ...prev, [field]: value };
        });
    };

    const canProceed = () => {
        switch (step) {
            case 0: return answers.goals.length > 0;
            case 1: return answers.values.length > 0;
            case 2: return answers.personality !== '';
            case 3: return answers.lookingFor !== '';
            case 4: return true; // optional
            default: return true;
        }
    };

    const handleFinish = async () => {
        // Save answers to profile
        try {
            await fetch('/api/user/emotional-onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(answers),
            });
            router.push('/discover');
        } catch (error) {
            console.error('Error saving onboarding:', error);
            router.push('/discover');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">Selecciona lo que más resuene contigo</p>
                        <div className="flex flex-wrap gap-2">
                            {GOALS.map(goal => (
                                <Badge
                                    key={goal}
                                    variant={answers.goals.includes(goal) ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => toggleAnswer('goals', goal)}
                                >
                                    {answers.goals.includes(goal) && '✓ '}{goal}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">¿Qué es lo más importante para ti?</p>
                        <div className="flex flex-wrap gap-2">
                            {VALUES.map(value => (
                                <Badge
                                    key={value}
                                    variant={answers.values.includes(value) ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => toggleAnswer('values', value)}
                                >
                                    {answers.values.includes(value) && '✓ '}{value}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">¿Cómo te describirían tus amigos?</p>
                        <div className="flex flex-wrap gap-2">
                            {PERSONALITY.map(p => (
                                <Badge
                                    key={p}
                                    variant={answers.personality === p ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => toggleAnswer('personality', p)}
                                >
                                    {answers.personality === p && '✓ '}{p}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">¿Qué buscas en tu próxima conexión?</p>
                        <div className="flex flex-wrap gap-2">
                            {LOOKING_FOR.map(lf => (
                                <Badge
                                    key={lf}
                                    variant={answers.lookingFor === lf ? 'default' : 'outline'}
                                    className="cursor-pointer hover:bg-primary/10"
                                    onClick={() => toggleAnswer('lookingFor', lf)}
                                >
                                    {answers.lookingFor === lf && '✓ '}{lf}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">¿Qué quieres evitar? (opcional)</p>
                        <div className="flex flex-wrap gap-2">
                            {AVOID.map(a => (
                                <Badge
                                    key={a}
                                    variant={answers.avoid.includes(a) ? 'destructive' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => toggleAnswer('avoid', a)}
                                >
                                    {answers.avoid.includes(a) && '✗ '}{a}
                                </Badge>
                            ))}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <Sparkles className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                    <CardTitle>{STEPS[step].title}</CardTitle>
                    <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">Paso {step + 1} de {STEPS.length}</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderStep()}

                    <div className="flex justify-between">
                        <Button
                            variant="outline"
                            onClick={() => setStep(s => s - 1)}
                            disabled={step === 0}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
                        </Button>

                        {step === STEPS.length - 1 ? (
                            <Button onClick={handleFinish}>
                                Comenzar <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        ) : (
                            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
                                Siguiente <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
