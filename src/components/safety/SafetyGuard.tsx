'use client';

import { useState, useEffect } from 'react';
import { AgeGate } from '@/components/auth/AgeGate';
import { LegalConsent } from '@/components/legal/LegalConsent';
import { useAuth } from '@/contexts/AuthContext';

export function SafetyGuard({ children }: { children: React.ReactNode }) {
    const { user, profile } = useAuth();
    const [ageGateAccepted, setAgeGateAccepted] = useState(false);

    useEffect(() => {
        // Check local session state for age gate
        if (typeof window !== 'undefined') {
            setAgeGateAccepted(!!(window as any).hasAcceptedAgeGate);

            const handleAccepted = () => setAgeGateAccepted(true);
            window.addEventListener('ageGateAccepted', handleAccepted);
            return () => window.removeEventListener('ageGateAccepted', handleAccepted);
        }
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
