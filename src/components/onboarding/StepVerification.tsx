'use client';

import { useState, useEffect } from 'react';
import { VerificationUpload } from "@/components/verification/VerificationUpload";

const GESTURES = ['smile', 'v_sign', 'thumbs_up', 'open_palm'];

export function StepVerification({ onComplete }: { onComplete: () => void }) {
    const [gesture, setGesture] = useState('smile');

    useEffect(() => {
        setGesture(GESTURES[Math.floor(Math.random() * GESTURES.length)]);
    }, []);

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Verificación de Identidad</h2>
                <p className="text-muted-foreground">Tu seguridad es nuestra prioridad. Sube una selfie con el gesto indicado.</p>
            </div>
            <VerificationUpload gesture={gesture} onComplete={onComplete} />
        </div>
    );
}
