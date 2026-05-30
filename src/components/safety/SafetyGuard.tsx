'use client';

import { useState, useEffect } from 'react';
import { AgeGate } from '@/components/auth/AgeGate';
import { LegalConsent } from '@/components/legal/LegalConsent';
import { useAuth } from '@/contexts/AuthContext';

export function SafetyGuard({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [ageGateAccepted, setAgeGateAccepted] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const AGE_GATE_KEY = 'alora_age_gate';

        const checkAgeGate = () => {
            try {
                const stored = localStorage.getItem(AGE_GATE_KEY);
                if (stored) {
                    const { timestamp } = JSON.parse(stored);
                    setAgeGateAccepted(Date.now() - timestamp < 86400000);
                    return;
                }
            } catch {}
            setAgeGateAccepted(false);
        };

        checkAgeGate();

        const handleAccepted = () => checkAgeGate();
        window.addEventListener('ageGateAccepted', handleAccepted);
        return () => window.removeEventListener('ageGateAccepted', handleAccepted);
    }, []);

    // 1. Age Gate (Mandatory before anything)
    if (!ageGateAccepted) {
        return <AgeGate />;
    }

    // 2. Wrap everything with Legal Consent (Displays conditionally)
    return (
        <>
            {children}
            {user && <LegalConsent />}
        </>
    );
}
