'use client';

import { useState } from 'react';
import { authService } from '@/lib/supabase/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await authService.sendPasswordResetEmail(email);
            setSent(true);
        } catch {
            setError('Error al enviar el correo. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Revisa tu email</CardTitle>
                    <CardDescription>
                        Te hemos enviado un enlace para restablecer tu contraseña a {email}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Link href="/login" className="text-sm text-primary hover:underline">
                        Volver a iniciar sesión
                    </Link>
                </CardFooter>
            </Card>
        );
    }

    return (
        <>
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Recuperar contraseña</CardTitle>
                <CardDescription>
                    Te enviaremos un enlace para restablecer tu contraseña
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {error && (
                        <Alert variant="destructive" role="alert">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Enviando...' : 'Enviar enlace'}
                    </Button>
                    <Link href="/login" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-3 w-3" /> Volver a iniciar sesión
                    </Link>
                </CardFooter>
            </form>
        </Card>
        <div className="text-center text-xs text-muted-foreground space-x-3 mt-4">
            <Link href="/terms" className="hover:underline">Términos</Link>
            <Link href="/privacy" className="hover:underline">Privacidad</Link>
            <Link href="/support" className="hover:underline">Ayuda</Link>
            <Link href="/contact" className="hover:underline">Contacto</Link>
        </div>
        </>
    );
}
