'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/supabase/services/auth';

export default function SuspendedPage() {
    const router = useRouter();

    useEffect(() => {
        authService.signOut().finally(() => {
            router.replace('/login');
        });
    }, [router]);

    return (
        <main className="min-h-dvh flex items-center justify-center bg-background text-foreground p-6">
            <div className="max-w-md text-center space-y-4">
                <h1 className="text-2xl font-bold">Cuenta suspendida</h1>
                <p className="text-muted-foreground">
                    Tu cuenta ha sido suspendida por el equipo de Alora. Si crees que esto es un error, contacta a soporte.
                </p>
                <p className="text-sm text-muted-foreground">Redirigiendo…</p>
            </div>
        </main>
    );
}
