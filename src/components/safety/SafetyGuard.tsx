'use client';

import { useState, useEffect } from 'react';
import { LegalConsent } from '@/components/legal/LegalConsent';
import { useAuth } from '@/contexts/AuthContext';
import { AGE_GATE_KEY } from '@/lib/constants/preferences';

const AGE_VERIFIED_KEY = 'alora_age_verified';

export function SafetyGuard({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [ageGateAccepted, setAgeGateAccepted] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const checkAgeGate = () => {
            try {
                const stored = localStorage.getItem(AGE_GATE_KEY);
                if (stored) {
                    const { timestamp } = JSON.parse(stored);
                    setAgeGateAccepted(Date.now() - timestamp < 365 * 24 * 60 * 60 * 1000);
                    return;
                }
            } catch {}
            setAgeGateAccepted(false);
        };

        checkAgeGate();

        window.addEventListener('ageGateAccepted', checkAgeGate);
        return () => window.removeEventListener('ageGateAccepted', checkAgeGate);
    }, []);

    const handleAcceptAge = () => {
        const now = Date.now();
        localStorage.setItem(AGE_GATE_KEY, JSON.stringify({ timestamp: now }));
        localStorage.setItem(AGE_VERIFIED_KEY, 'true');
        setAgeGateAccepted(true);
        window.dispatchEvent(new CustomEvent('ageGateAccepted'));
    };

    if (!mounted) return null;

    if (!ageGateAccepted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-6 max-w-sm">
                    <p className="text-lg font-semibold">Verificación de edad requerida</p>
                    <p className="text-sm text-muted-foreground">Debes confirmar que tienes 18 años o más para usar Alora.</p>
                    <div className="space-y-2">
                        <button
                            onClick={handleAcceptAge}
                            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Confirmo que tengo 18 años o más
                        </button>
                        <a
                            href="https://www.google.com"
                            className="block w-full px-4 py-3 bg-muted text-muted-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                        >
                            Soy menor de 18 años
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {children}
            {user && <LegalConsent />}
        </>
    );
}
