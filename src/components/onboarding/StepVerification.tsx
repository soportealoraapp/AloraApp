'use client';

import { VerificationUpload } from "@/components/verification/VerificationUpload";

export function StepVerification({ onComplete }: { onComplete: () => void }) {
    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Verificación de Identidad</h2>
                <p className="text-muted-foreground">Tu seguridad es nuestra prioridad. Sube una selfie y tu identificación.</p>
            </div>
            <VerificationUpload onComplete={onComplete} />
        </div>
    );
}
