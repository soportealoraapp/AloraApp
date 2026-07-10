"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/lib/supabase/services/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ADMIN_EMAIL } from "@/lib/admin-config";
import { Eye, EyeOff, Loader2, Lock, ShieldCheck, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState(ADMIN_EMAIL);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const denied = searchParams.get("denied");
        if (denied) {
            setError("No tienes permisos de administrador para acceder a esta sección.");
        }
    }, [searchParams]);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        setLoading(true);
        setError("");

        // Solo el correo oficial puede acceder al panel de administración.
        if (email.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
            setError("Credenciales incorrectas.");
            setLoading(false);
            return;
        }

        try {
            await authService.signIn(email, password);

            // Verificar que el usuario tenga rol de administrador antes de entrar.
            const res = await fetch("/api/admin/verifications?limit=1");
            if (!res.ok) {
                await authService.signOut();
                setError("No tienes permisos de administrador para acceder a esta sección.");
                setLoading(false);
                return;
            }

            router.replace("/admin");
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "";
            if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
                setError("Credenciales incorrectas.");
            } else if (message.includes("rate_limit")) {
                setError("Demasiados intentos. Espera un momento e intenta de nuevo.");
            } else if (message.includes("network") || message.includes("fetch")) {
                setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
            } else {
                setError("Error al iniciar sesión. Intenta de nuevo.");
            }
            setLoading(false);
        }
    }, [email, password, router, searchParams]);

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-background">
            <div
                className="w-full max-w-md rounded-3xl p-7 border border-border/50"
                style={{
                    background: 'hsl(var(--card))',
                    boxShadow: '0 20px 60px hsl(335 85% 76% / 0.12), 0 4px 16px rgba(0,0,0,0.06)',
                }}
            >
                <div className="text-center mb-7">
                    <div
                        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                        style={{
                            background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)',
                        }}
                    >
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl font-headline font-bold text-foreground">Acceso de Administrador</h1>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                        Panel exclusivo para el equipo de Alora.
                    </p>
                </div>

                {error && (
                    <Alert variant="destructive" className="mb-5 rounded-xl" role="alert">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                            Correo oficial
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            autoComplete="username"
                            readOnly
                            className="bg-muted/40"
                        />
                        <p className="text-xs text-muted-foreground">
                            Solo el correo oficial de soporte puede iniciar sesión.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            Contraseña
                        </Label>
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
                                placeholder="••••••••••••"
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
                        disabled={loading || !password}
                    >
                        {loading ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verificando...</>
                        ) : (
                            <>Entrar al panel <ArrowRight className="h-4 w-4 ml-1" /></>
                        )}
                    </Button>
                </form>

                <p className="text-center text-xs text-muted-foreground/60 mt-6">
                    Alora · Panel de administración
                </p>
            </div>
        </div>
    );
}
