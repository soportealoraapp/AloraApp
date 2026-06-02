'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, Clock } from 'lucide-react';

type Status = 'waiting' | 'approved' | 'expired' | 'not_found';

interface WaitlistInfo {
    status: Status;
    region: string;
    position: number | null;
    createdAt: string | null;
}

export function WaitlistView() {
    const router = useRouter();
    const [info, setInfo] = useState<WaitlistInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;
        fetch('/api/waitlist', { method: 'GET' })
            .then(r => r.json().catch(() => ({})))
            .then(data => {
                if (!mounted) return;
                setInfo({
                    status: data?.status ?? 'not_found',
                    region: data?.region ?? 'mx',
                    position: typeof data?.position === 'number' ? data.position : null,
                    createdAt: data?.createdAt ?? null,
                });
            })
            .catch(err => {
                if (!mounted) return;
                setError(err instanceof Error ? err.message : 'Error desconocido');
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });
        return () => { mounted = false; };
    }, []);

    const handleSignOut = async () => {
        try {
            await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
        } catch { /* ignore */ }
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const isApproved = info?.status === 'approved';

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                        {isApproved ? <CheckCircle2 className="h-8 w-8 text-green-600" /> : <Clock className="h-8 w-8 text-primary" />}
                    </div>
                    <CardTitle className="text-2xl">
                        {isApproved ? '¡Tu acceso fue aprobado!' : 'Estás en lista de espera'}
                    </CardTitle>
                    <CardDescription>
                        {isApproved
                            ? 'Ya puedes entrar a Alora. Te enviaremos un email con los próximos pasos.'
                            : 'Alora está en beta cerrada. Te avisaremos cuando liberemos un lugar para ti.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <p className="text-sm text-destructive text-center">{error}</p>
                    )}

                    {info?.status === 'waiting' && (
                        <div className="rounded-lg border p-4 bg-secondary/40 space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Región</span>
                                <span className="font-medium uppercase">{info.region}</span>
                            </div>
                            {info.position !== null && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Posición aproximada</span>
                                    <span className="font-medium">~{info.position}</span>
                                </div>
                            )}
                            {info.createdAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Solicitado</span>
                                    <span className="font-medium">
                                        {new Date(info.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {info?.status === 'not_found' && (
                        <div className="rounded-lg border p-4 bg-amber-50 border-amber-200 text-sm text-amber-900">
                            Aún no registramos tu solicitud. Si tienes un código beta, úsalo al registrarte.
                        </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                        {isApproved && (
                            <Button asChild className="w-full">
                                <Link href="/discover">Entrar a Alora</Link>
                            </Button>
                        )}
                        <Button variant="outline" onClick={handleSignOut} className="w-full">
                            Cerrar sesión
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center pt-2">
                        ¿Tienes un código de invitación? <Link href="/signup" className="text-primary hover:underline">Regístrate aquí</Link>.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
