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
        <div className="md:pl-60 min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-4 max-w-md px-4">
                <h1 className="text-4xl font-bold text-foreground">Algo salió mal</h1>
                <p className="text-muted-foreground">Ocurrió un error inesperado. Intenta de nuevo.</p>
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
