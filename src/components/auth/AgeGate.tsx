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
        return Date.now() - timestamp < 86400000; // 24h expiry
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
    const [accepted, setAccepted] = useState(getAgeGateAccepted);
    const [denied, setDenied] = useState(false);

    const handleAccept = () => {
        setAgeGateAccepted();
        setAccepted(true);
    };

    if (denied) {
        return (
            <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md"
                >
                    <ShieldAlert className="h-16 w-12 text-destructive mx-auto mb-6" />
                    <h1 className="text-2xl font-bold mb-4">Lo sentimos</h1>
                    <p className="text-muted-foreground mb-8">
                        Debes tener al menos 18 años para usar Alora.
                        La seguridad de nuestra comunidad es nuestra prioridad.
                    </p>
                </motion.div>
            </div>
        );
    }

    if (accepted) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <Card className="max-w-md p-8 text-center border-none shadow-2xl rounded-3xl bg-white">
                    <div className="bg-pink-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
                    </div>

                    <h2 className="text-2xl font-bold mb-2 text-gray-900">Bienvenido a Alora</h2>
                    <p className="text-gray-600 mb-8">
                        Al entrar, confirmas que eres mayor de edad (18+) y que respetas nuestras normas de comunidad.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button
                            className="bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full py-6 text-lg font-bold"
                            onClick={handleAccept}
                        >
                            Soy mayor de 18 años
                        </Button>
                        <Button
                            variant="ghost"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => setDenied(true)}
                        >
                            Soy menor de edad
                        </Button>
                    </div>

                    <p className="mt-6 text-[10px] text-gray-500 uppercase tracking-widest font-medium">
                        Safety First • Community Driven
                    </p>
                </Card>
            </motion.div>
        </div>
    );
}
