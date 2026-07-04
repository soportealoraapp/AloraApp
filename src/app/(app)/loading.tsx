import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/logo';

export default function Loading() {
    return (
        <div className="min-h-dvh flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
                <Logo className="h-10 w-auto" />
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Cargando...</p>
            </div>
        </div>
    );
}
