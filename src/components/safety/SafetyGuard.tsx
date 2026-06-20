'use client';

import { useState, useEffect } from 'react';
import { LegalConsent } from '@/components/legal/LegalConsent';
import { useAuth } from '@/contexts/AuthContext';

const AGE_GATE_KEY = 'alora_age_gate';

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

    if (!mounted) return null;

    if (!ageGateAccepted) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-6">
                    <p className="text-lg font-semibold">Verificación de edad requerida</p>
                    <p className="text-sm text-muted-foreground">Debes confirmar que tienes 18 años o más para usar Alora.</p>
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
