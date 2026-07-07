'use client';

import { useState } from 'react';
import { authService } from '@/lib/supabase/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
            setError('Error al enviar el correo. Verifica el email e intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
                className="w-full rounded-3xl p-7 border border-border/50 text-center space-y-6"
                style={{
                    background: 'hsl(var(--card))',
                    boxShadow: '0 20px 60px hsl(335 85% 76% / 0.12), 0 4px 16px rgba(0,0,0,0.06)',
                }}
            >
                <div
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, hsl(142 60% 50% / 0.2) 0%, hsl(142 60% 50% / 0.1) 100%)',
                    }}
                >
                    <CheckCircle className="h-8 w-8 text-green-500 dark:text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-headline font-bold text-foreground mb-2">Revisa tu email</h1>
                    <p className="text-sm text-muted-foreground">
                        Te hemos enviado un enlace para restablecer tu contraseña a{' '}
                        <strong className="text-foreground">{email}</strong>.
                    </p>
                </div>
                <Button asChild variant="default" className="w-full h-12 rounded-xl font-bold">
                    <Link href="/login">Volver a iniciar sesión</Link>
                </Button>
            </motion.div>
            <div className="text-center text-xs text-muted-foreground/60 space-x-3 mt-5">
                <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
                <Link href="/support" className="hover:text-foreground transition-colors">Ayuda</Link>
            </div>
            </>
        );
    }

    return (
        <>
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 28 }}
            className="w-full rounded-3xl p-7 border border-border/50"
            style={{
                background: 'hsl(var(--card))',
                boxShadow: '0 20px 60px hsl(335 85% 76% / 0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}
        >
            {/* Header */}
            <div className="text-center mb-7">
                <div
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)',
                    }}
                >
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-headline font-bold text-foreground">Recuperar contraseña</h1>
                <p className="text-muted-foreground mt-1.5 text-sm">
                    Te enviaremos un enlace para restablecerla
                </p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-5 rounded-xl" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        Correo electrónico
                    </Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="tu@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="email"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full font-bold text-base h-12 rounded-xl mt-2"
                    disabled={loading || !email.trim()}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                    ) : (
                        'Enviar enlace de recuperación'
                    )}
                </Button>
            </form>

            <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-5 font-medium"
            >
                <ArrowLeft className="h-3.5 w-3.5" /> Volver a iniciar sesión
            </Link>
        </motion.div>

        <div className="text-center text-xs text-muted-foreground/60 space-x-3 mt-5">
            <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Ayuda</Link>
        </div>
        </>
    );
}
