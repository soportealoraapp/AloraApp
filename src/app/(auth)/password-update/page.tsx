'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle, Eye, EyeOff, Loader2, X, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import Link from 'next/link';

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

    const passwordChecks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSpecial: /[^A-Za-z0-9]/.test(password),
        matches: password === confirmPassword && confirmPassword.length > 0,
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!passwordChecks.minLength) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
        if (!passwordChecks.hasUppercase) { setError('La contraseña debe contener al menos una mayúscula'); return; }
        if (!passwordChecks.hasNumber) { setError('La contraseña debe contener al menos un número'); return; }
        if (!passwordChecks.hasSpecial) { setError('La contraseña debe contener al menos un carácter especial'); return; }
        if (!passwordChecks.matches) { setError('Las contraseñas no coinciden'); return; }

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

    const cardStyle = {
        background: 'hsl(var(--card))',
        boxShadow: '0 20px 60px hsl(335 85% 76% / 0.12), 0 4px 16px rgba(0,0,0,0.06)',
    };

    if (checkingSession) {
        return (
            <div className="w-full rounded-3xl p-7 border border-border/50 space-y-4" style={cardStyle}>
                <Skeleton className="h-14 w-14 rounded-2xl mx-auto" />
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
            </div>
        );
    }

    if (tokenError) {
        return (
            <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                className="w-full rounded-3xl p-7 border border-border/50 text-center space-y-5"
                style={cardStyle}
            >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                    <Lock className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <h1 className="text-2xl font-headline font-bold text-foreground mb-2">Enlace no válido</h1>
                    <p className="text-sm text-muted-foreground">
                        El enlace para restablecer tu contraseña no es válido o ha expirado. Solicita uno nuevo.
                    </p>
                </div>
                <Button asChild variant="default" className="w-full h-12 rounded-xl font-bold">
                    <Link href="/forgot-password">Solicitar nuevo enlace</Link>
                </Button>
            </motion.div>
            </>
        );
    }

    if (success) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                className="w-full rounded-3xl p-7 border border-border/50 text-center space-y-5"
                style={cardStyle}
            >
                <div
                    className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, hsl(142 60% 50% / 0.2) 0%, hsl(142 60% 50% / 0.1) 100%)' }}
                >
                    <CheckCircle className="h-7 w-7 text-green-500 dark:text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-headline font-bold text-foreground mb-2">¡Contraseña actualizada!</h1>
                    <p className="text-sm text-muted-foreground">
                        Tu contraseña se actualizó correctamente. Redirigiendo al inicio de sesión...
                    </p>
                </div>
                <div className="flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
            </motion.div>
        );
    }

    return (
        <>
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="w-full rounded-3xl p-7 border border-border/50"
            style={cardStyle}
        >
            {/* Header */}
            <div className="text-center mb-7">
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)' }}
                >
                    <Lock className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-headline font-bold text-foreground">Nueva contraseña</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">Introduce y confirma tu nueva contraseña</p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-5 rounded-xl" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Nueva contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="rounded-2xl h-12 border-muted bg-background/50 pr-10"
                            minLength={8}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {password.length > 0 && (
                        <div className="space-y-1 pt-1">
                            {[
                                { ok: passwordChecks.minLength, label: 'Mínimo 8 caracteres' },
                                { ok: passwordChecks.hasUppercase, label: 'Al menos una mayúscula' },
                                { ok: passwordChecks.hasNumber, label: 'Al menos un número' },
                                { ok: passwordChecks.hasSpecial, label: 'Al menos un carácter especial' },
                            ].map(({ ok, label }) => (
                                <div key={label} className="flex items-center gap-1.5">
                                    {ok ? <Check className="h-3 w-3 text-green-500 dark:text-green-400" /> : <X className="h-3 w-3 text-muted-foreground" />}
                                    <span className="text-xs text-muted-foreground">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Confirmar contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            id="confirmPassword"
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="rounded-2xl h-12 border-muted bg-background/50 pr-10"
                            minLength={8}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {confirmPassword.length > 0 && (
                        <p className={`text-xs ${passwordChecks.matches ? 'text-green-500' : 'text-destructive'}`}>
                            {passwordChecks.matches ? 'Las contraseñas coinciden ✓' : 'Las contraseñas no coinciden'}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full font-bold text-base h-12 rounded-xl"
                    disabled={loading || !passwordChecks.minLength || !passwordChecks.hasUppercase || !passwordChecks.hasNumber || !passwordChecks.hasSpecial || !passwordChecks.matches}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</>
                    ) : (
                        'Actualizar contraseña'
                    )}
                </Button>
            </form>
        </motion.div>

        <div className="text-center text-xs text-muted-foreground/60 space-x-3 mt-5">
            <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Ayuda</Link>
        </div>
        </>
    );
}
