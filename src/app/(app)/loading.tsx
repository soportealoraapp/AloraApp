import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
        </div>
    );
}
