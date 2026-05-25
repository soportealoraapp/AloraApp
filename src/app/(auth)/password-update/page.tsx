'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle } from 'lucide-react';

export default function PasswordUpdatePage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [checkingSession, setCheckingSession] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                router.replace('/login');
                return;
            }
            setCheckingSession(false);
        });
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    if (checkingSession) {
        return (
            <Card className="w-full">
                <CardContent className="py-8 text-center text-muted-foreground">
                    Verificando sesión...
                </CardContent>
            </Card>
        );
    }

    if (success) {
        return (
            <Card className="w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-6 w-6 text-green-600" />
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
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="password">Nueva contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10"
                                minLength={6}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            minLength={6}
                            required
                        />
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
