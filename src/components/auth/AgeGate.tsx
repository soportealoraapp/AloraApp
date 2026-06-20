'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldAlert, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';

const AGE_GATE_KEY = 'alora_age_gate';

function getAgeGateAccepted(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        const stored = localStorage.getItem(AGE_GATE_KEY);
        if (!stored) return false;
        const { timestamp } = JSON.parse(stored);
        return Date.now() - timestamp < 365 * 24 * 60 * 60 * 1000;
    } catch {
        return false;
    }
}

function setAgeGateAccepted() {
    try {
        localStorage.setItem(AGE_GATE_KEY, JSON.stringify({ timestamp: Date.now() }));
    } catch {}
}

export function AgeGate() {
    const [accepted, setAccepted] = useState(() => {
        if (typeof window === 'undefined') return false;
        return getAgeGateAccepted();
    });
    const [denied, setDenied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleAccept = () => {
        setAgeGateAccepted();
        setAccepted(true);
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('ageGateAccepted'));
        }
    };

    if (!mounted || accepted) return null;

    if (denied) {
        return (
            <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 text-center" role="dialog" aria-modal="true" aria-label="Verificación de edad">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md"
                >
                    <ShieldAlert className="h-16 w-12 text-destructive mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4 text-foreground">Lo sentimos</h1>
                    <p className="text-muted-foreground mb-8">
                        Debes tener al menos 18 años para usar Alora.
                        La seguridad de nuestra comunidad es nuestra prioridad.
                    </p>
                    <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                            setDenied(false);
                        }}
                    >
                        Entendido
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Verificación de edad">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="max-w-md p-8 text-center border-none shadow-2xl rounded-3xl bg-card">
                    <div className="bg-primary/10 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="h-8 w-8 text-primary fill-primary" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-card-foreground">Bienvenido a Alora</h2>
                    <p className="text-muted-foreground mb-8">
                        Al entrar, confirmas que eres mayor de edad (18+) y que respetas nuestras normas de comunidad.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="bg-gradient-to-r from-primary to-accent text-white dark:from-primary dark:to-accent rounded-full py-6 text-lg font-bold"
                            onClick={handleAccept}
                        >
                            Soy mayor de 18 años
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => setDenied(true)}
                        >
                            Soy menor de edad
                        </Button>
                    </div>

                    <p className="mt-6 text-xs text-muted-foreground uppercase tracking-widest font-medium">
                        Seguridad Primero • Comunidad Segura
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
