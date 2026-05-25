'use client';

import { PLANS } from '@/lib/domain/subscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Check, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SubscriptionPage() {
    const { profile } = useAuth();
    const [loading, setLoading] = useState<string | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const handleSubscribe = async (plan: string) => {
        if (!profile) return;
        setLoading(plan);
        try {
            const res = await fetch('/api/stripe/session', {
                method: 'POST',
                body: JSON.stringify({ plan, userId: profile.id })
            });
            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            toast({ title: 'Error', description: 'No se pudo iniciar el pago', variant: 'destructive' });
            setLoading(null);
        }
    };

    const currentPlan = profile?.plan || 'free';

    return (
        <div className="md:pl-60 p-6 space-y-8 bg-gray-50 min-h-screen">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500">
                    Elige tu experiencia Alora
                </h1>
                <p className="text-gray-500">Sin límites ocultos. Mejora tu experiencia si lo deseas.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {(Object.keys(PLANS) as Array<keyof typeof PLANS>).map((key) => {
                    const plan = PLANS[key];
                    const isCurrent = currentPlan === key;
                    const isPremium = key === 'premium';

                    return (
                        <Card key={key} className={`relative border-2 ${isCurrent ? 'border-pink-500' : 'border-transparent'} ${isPremium ? 'shadow-xl scale-105 z-10' : ''}`}>
                            {isCurrent && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">Plan Actual</div>}

                            <CardHeader>
                                <CardTitle className="text-xl flex justify-between items-center">
                                    {plan.name}
                                    <span className="text-2xl font-bold">${plan.price}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2">
                                    {plan.features.map(feat => (
                                        <li key={feat} className="flex gap-2 items-center text-sm text-gray-600">
                                            <Check className="h-4 w-4 text-green-500" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className={`w-full ${isPremium ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90' : ''}`}
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
        </div>
    );
}
