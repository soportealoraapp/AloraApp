"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { authService } from "@/lib/supabase/services/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2, Mail } from "lucide-react";

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.62-3.96 1.62-3.33 0-6.03-2.7-6.03-6.03s2.7-6.03 6.03-6.03c1.87 0 3.13.77 3.9 1.5l2.73-2.73C18.74 1.94 15.96 1 12.48 1 7.02 1 3 5.02 3 9.5s4.02 8.5 9.48 8.5c2.9 0 5.2-1 6.84-2.62 1.73-1.68 2.34-4.27 2.34-6.42 0-.84-.08-1.48-.18-2.08h-9.8z" fill="currentColor" />
    </svg>
);

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
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
    }, []);

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

            router.push("/discover");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Invalid login credentials")) {
                setError("Email o contraseña incorrectos.");
            } else if (message.includes("Email not confirmed")) {
                setError("Por favor confirma tu email antes de iniciar sesión.");
            } else if (message.includes("rate_limit")) {
                setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
            } else if (message.includes("network") || message.includes("fetch")) {
                setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
            } else {
                setError(message || "Error al iniciar sesión. Intenta de nuevo.");
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
        <Card className="w-full">
            <CardHeader className="text-center">
                {pendingEmail ? (
                    <div className="space-y-2">
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                            <Mail className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">¡Email verificado!</CardTitle>
                        <CardDescription>
                            Tu cuenta está lista. Inicia sesión con {pendingEmail} para completar tu perfil.
                        </CardDescription>
                    </div>
                ) : (
                    <>
                        <CardTitle className="text-2xl font-headline">¡Hola de nuevo!</CardTitle>
                        <CardDescription>Inicia sesión para encontrar tu conexión.</CardDescription>
                    </>
                )}
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
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
                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                autoComplete="current-password"
                                className="pr-10"
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
                    </div>
                    <div className="flex justify-end">
                        <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                    <Button type="submit" className="w-full font-bold" disabled={loading || !email.trim() || !password}>
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...</>
                        ) : (
                            "Iniciar Sesión"
                        )}
                    </Button>
                </form>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Button variant="outline" onClick={handleGoogleLogin} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
                        Google
                    </Button>
                </div>
            </CardContent>
            <CardFooter className="justify-center text-sm">
                <p>
                    ¿No tienes cuenta?{" "}
                    <Link href="/signup" className="font-semibold text-primary hover:underline">
                        Regístrate
                    </Link>
                </p>
            </CardFooter>
        </Card>
        <div className="text-center text-xs text-muted-foreground space-x-3 mt-4">
            <Link href="/terms" className="hover:underline">Términos</Link>
            <Link href="/privacy" className="hover:underline">Privacidad</Link>
            <Link href="/support" className="hover:underline">Ayuda</Link>
        </div>
        </>
    );
}
