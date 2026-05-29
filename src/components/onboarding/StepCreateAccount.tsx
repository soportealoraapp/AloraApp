'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/supabase/services/auth';
import { Eye, EyeOff, Loader2, Check, X, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepCreateAccountProps {
    onAccountCreated: (userId: string) => void;
}

export function StepCreateAccount({ onAccountCreated }: StepCreateAccountProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const passwordChecks = {
        minLength: password.length >= 6,
        hasNumber: /\d/.test(password),
        hasLetter: /[a-zA-Z]/.test(password),
        matches: password === confirmPassword && confirmPassword.length > 0,
    };
    const allPasswordValid = passwordChecks.minLength && passwordChecks.hasNumber && passwordChecks.hasLetter;

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const canSubmit = isEmailValid && allPasswordValid && passwordChecks.matches && agreedToTerms && !loading;

    const [showEmailSent, setShowEmailSent] = useState(false);

    const handleSignUp = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setError(null);

        try {
            const result = await authService.signUp(email, password);

            if (!result?.id) {
                throw new Error('No se pudo crear la cuenta. Intenta de nuevo.');
            }

            sessionStorage.setItem('alora_signup_email', email);
            setShowEmailSent(true);

            toast({
                title: "Cuenta creada",
                description: "Hemos enviado un enlace de verificación a tu email.",
            });

            onAccountCreated(result.id);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al crear la cuenta';

            if (message.includes('already registered') || message.includes('already exists') || message.includes('duplicate')) {
                setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
            } else if (message.includes('rate_limit') || message.includes('Too many')) {
                setError('Demasiados intentos. Espera un momento e intenta de nuevo.');
            } else if (message.includes('network') || message.includes('fetch')) {
                setError('Error de conexión. Verifica tu internet.');
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }, [email, password, canSubmit, onAccountCreated, toast]);

    if (showEmailSent) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
                <div className="rounded-full bg-primary/10 p-4">
                    <Mail className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Revisa tu email</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Hemos enviado un enlace de verificación a <strong className="text-foreground">{email}</strong>.
                    Confirma tu email para continuar con tu perfil.
                </p>
                <Card className="w-full p-4 bg-muted/50 border-muted">
                    <p className="text-xs text-muted-foreground">
                        ¿No recibiste el correo? Revisa tu bandeja de spam o solicita un nuevo enlace desde
                        la página de inicio de sesión.
                    </p>
                </Card>
                <Button onClick={() => router.push('/login')} className="w-full h-12 rounded-2xl font-bold">
                    Ir a iniciar sesión
                </Button>
                <p className="text-xs text-muted-foreground">
                    ¿Usaste otro email?{' '}
                    <button type="button" onClick={() => setShowEmailSent(false)} className="text-primary hover:underline">
                        Volver al formulario
                    </button>
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 flex-1 flex flex-col">
            <div className="space-y-1 text-center">
                <h2 className="text-2xl font-bold text-foreground">Crear tu cuenta</h2>
                <p className="text-sm text-muted-foreground">
                    Tu espacio seguro comienza aquí
                </p>
            </div>

            <form onSubmit={handleSignUp} className="space-y-5 flex-1">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Correo electrónico
                    </Label>
                    <Input
                        type="email"
                        placeholder="tu@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        autoComplete="email"
                        className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50"
                    />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="new-password"
                            className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {password.length > 0 && (
                        <div className="space-y-1 pt-1">
                            <div className="flex items-center gap-1.5">
                                {passwordChecks.minLength ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                                <span className="text-[10px] text-muted-foreground">Mínimo 6 caracteres</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {passwordChecks.hasLetter ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                                <span className="text-[10px] text-muted-foreground">Al menos una letra</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {passwordChecks.hasNumber ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
                                <span className="text-[10px] text-muted-foreground">Al menos un número</span>
                            </div>
                        </div>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                >
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Confirmar contraseña
                    </Label>
                    <div className="relative">
                        <Input
                            type={showConfirm ? "text" : "password"}
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            autoComplete="new-password"
                            className="rounded-2xl h-12 border-muted focus-visible:ring-primary/20 bg-background/50 pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    {confirmPassword.length > 0 && (
                        <p className={`text-[10px] ${passwordChecks.matches ? 'text-green-500' : 'text-destructive'}`}>
                            {passwordChecks.matches ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                        </p>
                    )}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-start gap-2"
                >
                    <input
                        type="checkbox"
                        id="terms"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        disabled={loading}
                        className="mt-1 h-4 w-4 rounded border-muted text-primary focus:ring-primary/20"
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                        Acepto los Términos de Servicio y la Política de Privacidad de Alora
                    </Label>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive"
                    >
                        {error}
                        {error.includes('ya está registrado') && (
                            <button
                                type="button"
                                onClick={() => router.push('/login')}
                                className="block mt-1 text-primary hover:underline font-medium"
                            >
                                Ir a iniciar sesión →
                            </button>
                        )}
                    </motion.div>
                )}

                <div className="pt-4">
                    <Button
                        type="submit"
                        className="w-full h-12 rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                        disabled={!canSubmit}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</>
                        ) : (
                            'Crear mi cuenta ✨'
                        )}
                    </Button>
                </div>
            </form>

            <p className="text-center text-xs text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <a href="/login" className="text-primary hover:underline font-semibold">
                    Inicia sesión
                </a>
            </p>
        </div>
    );
}
