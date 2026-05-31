'use client';

import { PLANS } from '@/lib/domain/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const COMPARISON_FEATURES = [
    { feature: 'Likes diarios', free: '50', plus: 'Ilimitados' },
    { feature: 'Prioridad en Discover', free: false, plus: true },
    { feature: 'Boost de visibilidad', free: 'Cada 5 días de racha', plus: 'Cada 7 días' },
    { feature: 'Rewind (deshacer swipe)', free: '1/día', plus: '3/día' },
    { feature: 'Modo Viaje', free: false, plus: true },
    { feature: 'Modo Incógnito', free: false, plus: true },
    { feature: 'Historial de visitas', free: 'Últimos 3', plus: 'Completo' },
    { feature: 'Compatibilidad', free: 'Básica', plus: 'Explicada' },
    { feature: 'Chat', free: true, plus: true },
    { feature: 'Quizzes', free: true, plus: true },
    { feature: 'Verificación', free: true, plus: true },
];

export default function SubscriptionPage() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubscribe = async (plan: string) => {
        if (!profile) return;
        setLoading(plan);
        try {
            const res = await fetch('/api/lemonsqueezy/checkout', {
                method: 'POST',
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Error creating checkout');
            }
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo iniciar el pago', variant: 'destructive' });
            setLoading(null);
        }
    };

    const currentPlan = (profile as any)?.subscriptionStatus || 'free';

    return (
        <div className="md:pl-60 p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                    Elige tu experiencia Alora
                </h1>
                <p className="text-gray-500">Sin limites ocultos. Mejora tu experiencia si lo deseas.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
                    const plan = PLANS[key];
                    const isCurrent = currentPlan === key;
                    const isPlus = key === 'plus';

                    return (
                        <Card key={key} className={`relative border-2 ${isCurrent ? 'border-pink-500' : 'border-transparent'} ${isPlus ? 'shadow-xl scale-105 z-10' : ''}`}>
                            {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">Plan Actual</div>}
                            {isPlus && !isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"><Sparkles className="h-3 w-3" /> Recomendado</div>}

                            <CardHeader>
                                <CardTitle className="text-xl flex justify-between items-center">
                                    {plan.name}
                                    <span className="text-2xl font-bold">${plan.price} <span className="text-sm font-normal text-muted-foreground">MXN/mes</span></span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {plan.features.map(feat => (
                                        <li key={feat} className="flex gap-2 items-center text-sm text-gray-600">
                                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${isPlus ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90' : ''}`}
                                    variant={isCurrent ? "outline" : "default"}
                                    disabled={isCurrent || !!loading}
                                    onClick={() => handleSubscribe(key)}
                                >
                                    {loading === key ? <Loader2 className="animate-spin" /> : isCurrent ? 'Activo' : 'Elegir Plan'}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle className="text-lg">Comparativa de beneficios</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Beneficio</th>
                                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Gratis</th>
                                    <th className="text-center py-3 px-2 font-medium text-primary">Alora+</th>
                                </tr>
                            </thead>
                            <tbody>
                                {COMPARISON_FEATURES.map((row, i) => (
                                    <tr key={i} className="border-b last:border-0">
                                        <td className="py-3 px-2 font-medium">{row.feature}</td>
                                        <td className="py-3 px-2 text-center">
                                            {typeof row.free === 'boolean' ? (
                                                row.free ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-400 mx-auto" />
                                            ) : (
                                                <span className="text-muted-foreground">{row.free}</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-2 text-center">
                                            {typeof row.plus === 'boolean' ? (
                                                row.plus ? <Check className="h-4 w-4 text-green-500 mx-auto" /> : <X className="h-4 w-4 text-red-400 mx-auto" />
                                            ) : (
                                                <span className="font-medium text-primary">{row.plus}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
