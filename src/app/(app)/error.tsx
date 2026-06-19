'use client';

import { Button } from '@/components/ui/button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 max-w-md px-4">
                <h1 className="text-4xl font-bold text-foreground">Ups, algo no salió bien</h1>
                <p className="text-muted-foreground">No pudimos completar tu solicitud. Por favor, intenta de nuevo.</p>
                {error.digest && (
                    <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
                )}
                <Button onClick={reset}>
                    Reintentar
                </Button>
            </div>
        </div>
    );
}
