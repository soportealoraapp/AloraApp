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
        <div className="md:pl-60 min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center space-y-4 max-w-md px-4">
                <h1 className="text-4xl font-bold text-gray-800">Algo salió mal</h1>
                <p className="text-gray-500">Ocurrió un error inesperado. Intenta de nuevo.</p>
                {error.digest && (
                    <p className="text-xs text-gray-400">Error ID: {error.digest}</p>
                )}
                <Button onClick={reset} className="bg-indigo-600 hover:bg-indigo-700">
                    Reintentar
                </Button>
            </div>
        </div>
    );
}
