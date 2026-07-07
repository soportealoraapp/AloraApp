'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { FormSkeleton } from '@/components/ui/skeleton';

export default function PasswordUpdatePage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const [tokenError, setTokenError] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();
    const supabaseRef = useRef(createClient());

    useEffect(() => {
        supabaseRef.current.auth.getSession().then(({ data, error }) => {
            if (error || !data.session) {
                setTokenError(true);
                setCheckingSession(false);
                return;
            }
            setCheckingSession(false);
        }).catch(() => {
            setTokenError(true);
            setCheckingSession(false);
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (!/[A-Z]/.test(password)) {
            setError('La contraseña debe contener al menos una mayúscula');
            return;
        }

        if (!/\d/.test(password)) {
            setError('La contraseña debe contener al menos un número');
            return;
        }

        if (!/[^A-Za-z0-9]/.test(password)) {
            setError('La contraseña debe contener al menos un carácter especial');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabaseRef.current.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch {
            setError('Error al actualizar la contraseña. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <Card className="w-full">
                <CardContent className="py-8">
                    <FormSkeleton />
                </CardContent>
            </Card>
        );
    }

    if (tokenError) {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                        <Lock className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <CardTitle>Enlace no válido o expirado</CardTitle>
                    <CardDescription>
                        El enlace para restablecer tu contraseña no es válido o ha expirado. Solicita uno nuevo desde la página de inicio de sesión.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                    <Button variant="outline" onClick={() => router.push('/login')}>
                        Volver al inicio de sesión
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle>Contraseña actualizada</CardTitle>
                    <CardDescription>
                        Tu contraseña se ha actualizado correctamente. Redirigiendo al inicio de sesión...
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Nueva contraseña</CardTitle>
                <CardDescription>
                    Introduce tu nueva contraseña
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
                        <Label htmlFor="password">Nueva contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 8 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repite la contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 pr-10"
                                minLength={8}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
