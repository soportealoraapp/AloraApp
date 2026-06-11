'use client';

import { Card, CardContent } from '@/components/ui/card';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { Shield, Brain, Heart, Sparkles, MessageCircle, Lock, Users, TrendingUp } from 'lucide-react';

const reasons = [
    {
        icon: Brain,
        title: 'Compatibilidad Profunda',
        description: 'No es solo swiping. Analizamos 6 dimensiones: valores, objetivos, personalidad, quizzes, intereses y estilo de vida.',
        color: 'text-accent',
        bg: 'bg-accent/30',
    },
    {
        icon: Sparkles,
        title: 'Icebreakers Inteligentes',
        description: 'Icebreakers personalizados basados en compatibilidad para iniciar conversaciones con más confianza.',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: Shield,
        title: 'Seguridad para Mujeres',
        description: 'Verificación de identidad, detección de acoso, modo incógnito, y control total de tu visibilidad.',
        color: 'text-accent',
        bg: 'bg-accent/30',
    },
    {
        icon: Heart,
        title: 'Relaciones Reales',
        description: 'Medimos el éxito por conversaciones que sobreviven, no por matches que se olvidan.',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
    },
    {
        icon: MessageCircle,
        title: 'Conversaciones que Funcionan',
        description: 'Icebreakers basados en compatibilidad y detección de conversaciones abandonadas.',
        color: 'text-primary',
        bg: 'bg-primary/10',
    },
    {
        icon: TrendingUp,
        title: 'Tu Progreso Importa',
        description: 'Trust Score, calidad de perfil, rachas, y insights diarios. Alora crece contigo.',
        color: 'text-warning',
        bg: 'bg-warning/10',
    },
];

export default function WhyAloraPage() {
    return (
        <div className="p-6 space-y-8">
            <div className="text-center max-w-2xl mx-auto">
                <SectionTitle title="¿Por qué Alora?" subtitle="Una app de citas que prioriza conexiones reales sobre swipes infinitos" />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {reasons.map((reason) => (
                    <Card key={reason.title} className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6 space-y-3">
                            <div className={`w-12 h-12 rounded-xl ${reason.bg} flex items-center justify-center`}>
                                <reason.icon className={`h-6 w-6 ${reason.color}`} />
                            </div>
                            <h3 className="font-bold text-lg">{reason.title}</h3>
                            <p className="text-sm text-muted-foreground">{reason.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center max-w-xl mx-auto space-y-4">
                <p className="text-lg text-muted-foreground">
                    Alora no es para todos. Es para personas que buscan algo real.
                </p>
                <div className="flex justify-center gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary">6</p>
                        <p className="text-xs text-muted-foreground">Dimensiones de compatibilidad</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary">IA</p>
                        <p className="text-xs text-muted-foreground">Icebreakers con Gemini</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-primary">100%</p>
                        <p className="text-xs text-muted-foreground">Identidad verificable</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
