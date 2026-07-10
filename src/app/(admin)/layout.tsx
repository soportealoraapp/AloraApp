'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, ShieldCheck } from 'lucide-react';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { signOut } = useAuth();

    const isLoginPage = pathname === '/admin/login';

    const handleLogout = async () => {
        await signOut();
        router.replace('/admin/login');
    };

    // La pantalla de login es de pantalla completa, sin chrome de administrador.
    if (isLoginPage) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-dvh bg-background">
            <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Alora · Panel de Administración</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-1" /> Cerrar sesión
                    </Button>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        </div>
    );
}
