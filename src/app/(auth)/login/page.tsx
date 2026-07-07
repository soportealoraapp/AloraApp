"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { authService } from "@/lib/supabase/services/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.96 1.62-3.33 0-6.03-2.7-6.03-6.03s2.7-6.03 6.03-6.03c1.87 0 3.13.77 3.9 1.5l2.73-2.73C18.74 1.94 15.96 1 12.48 1 7.02 1 3 5.02 3 9.5s4.02 8.5 9.48 8.5c2.9 0 5.2-1 6.84-2.62 1.73-1.68 2.34-4.27 2.34-6.42 0-.84-.08-1.48-.18-2.08h-9.8z" fill="currentColor" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pendingEmail, setPendingEmail] = useState<string | null>(null);

    useEffect(() => {
        const stored = sessionStorage.getItem('alora_signup_email');
        if (stored) {
            setPendingEmail(stored);
            setEmail(stored);
            sessionStorage.removeItem('alora_signup_email');
        }
        const urlError = searchParams.get('error');
        if (urlError === 'profile_creation_failed') {
            setError('No se pudo crear tu perfil. Por favor, intenta de nuevo.');
        } else if (urlError) {
            setError('Ocurrió un error. Por favor, intenta de nuevo.');
        }
    }, [searchParams]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password) return;

        setLoading(true);
        setError("");

        try {
            const user = await authService.signIn(email, password);

            if (!user.emailVerified) {
                setError("Por favor verifica tu email antes de iniciar sesión.");
                await authService.signOut();
                return;
            }

            const profileRes = await fetch('/api/profile');
            if (profileRes.ok) {
                const profileData = await profileRes.json();
                if (profileData && !profileData.isCompleted) {
                    router.push("/onboarding");
                    return;
                }
                router.push("/discover");
            } else if (profileRes.status === 404) {
                router.push("/onboarding");
            } else {
                router.push("/discover");
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
                setError("Email o contraseña incorrectos.");
            } else if (message.includes("rate_limit")) {
                setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
            } else if (message.includes("network") || message.includes("fetch")) {
                setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
            } else {
                setError("Error al iniciar sesión. Intenta de nuevo.");
            }
        } finally {
            setLoading(false);
        }
    }, [email, password, router]);

    const handleGoogleLogin = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            await authService.signInWithGoogle();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("provider is not enabled")) {
                setError("El inicio de sesión con Google no está habilitado actualmente.");
            } else if (message.includes("popup")) {
                setError("La ventana de Google fue bloqueada. Permite popups e intenta de nuevo.");
            } else {
                setError("Error al conectar con Google. Por favor, intenta de nuevo.");
            }
            setLoading(false);
        }
    }, []);

    return (
        <>
        {/* Card with glass effect */}
        <div
            className="w-full rounded-3xl p-7 border border-border/50"
            style={{
                background: 'hsl(var(--card))',
                boxShadow: '0 20px 60px hsl(335 85% 76% / 0.12), 0 4px 16px rgba(0,0,0,0.06)',
            }}
        >
            {/* Header */}
            <div className="text-center mb-7">
                {pendingEmail ? (
                    <div className="space-y-2">
                        <div
                            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)',
                            }}
                        >
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-headline font-bold text-gradient">¡Email verificado!</h1>
                        <p className="text-sm text-muted-foreground">
                            Tu cuenta está lista. Inicia sesión con <span className="text-foreground font-medium">{pendingEmail}</span> para completar tu perfil.
                        </p>
                    </div>
                ) : (
                    <>
                        <h1 className="text-2xl font-headline font-bold text-foreground">¡Hola de nuevo! 👋</h1>
                        <p className="text-muted-foreground mt-1.5 text-sm">Inicia sesión para encontrar tu conexión.</p>
                    </>
                )}
            </div>

            {error && (
                <Alert variant="destructive" className="mb-5 rounded-xl" role="alert">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            Contraseña
                        </Label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="current-password"
                            className="pr-12"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full font-bold text-base h-12 rounded-xl mt-2"
                    disabled={loading || !email.trim() || !password}
                >
                    {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...</>
                    ) : (
                        <>Iniciar Sesión <ArrowRight className="h-4 w-4 ml-1" /></>
                    )}
                </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
                <div className="separator-gradient" />
                <div className="relative flex justify-center -mt-2.5">
                    <span className="bg-card px-3 text-xs text-muted-foreground/70 uppercase tracking-widest font-medium">
                        O continúa con
                    </span>
                </div>
            </div>

            {/* Google */}
            <Button
                variant="outline"
                className="w-full font-semibold border-border/60 h-12 rounded-xl hover:bg-secondary/60"
                onClick={handleGoogleLogin}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <GoogleIcon className="mr-2 h-5 w-5" />
                )}
                Continuar con Google
            </Button>

            {/* Footer link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
                ¿No tienes cuenta?{" "}
                <Link href="/signup" className="font-bold text-primary hover:text-primary/80 transition-colors">
                    Regístrate gratis
                </Link>
            </p>
        </div>

        {/* Legal links */}
        <div className="text-center text-xs text-muted-foreground/60 space-x-3 mt-5">
            <Link href="/terms" className="hover:text-foreground transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contacto</Link>
            <Link href="/support" className="hover:text-foreground transition-colors">Ayuda</Link>
        </div>
        </>
    );
}
