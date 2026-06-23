'use client';

import { LegalConsent } from '@/components/legal/LegalConsent';
import { useAuth } from '@/contexts/AuthContext';

export function SafetyGuard({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();

    return (
        <>
            {children}
            {user && <LegalConsent />}
        </>
    );
}
