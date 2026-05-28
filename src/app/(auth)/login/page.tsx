"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { authService } from "@/lib/supabase/services/auth";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = await authService.signIn(email, password);

      if (!user.emailVerified) {
        setError("Por favor verifica tu email antes de iniciar sesión.");
        await authService.signOut();
        return;
      }

      toast({
        title: "¡Bienvenida de nuevo!",
        description: "Has iniciado sesión exitosamente.",
      });

      router.push("/discover");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Error de acceso",
        description: error.message || "Credenciales incorrectas. Por favor, revisa tus datos.",
        variant: "destructive"
      });
      setError(error.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      await authService.signInWithGoogle();
      // Supabase handles the redirect to /auth/callback
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.message?.includes("provider is not enabled")) {
        setError("El inicio de sesión con Google no está habilitado actualmente.");
      } else {
        setError("Error al conectar con Google. Por favor, intenta de nuevo.");
      }
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-headline">¡Bienvenida de nuevo!</CardTitle>
        <CardDescription>Inicia sesión para encontrar tu conexión.</CardDescription>
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <Button type="submit" className="w-full font-bold" disabled={loading}>
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
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
            <GoogleIcon className="mr-2 h-4 w-4" /> Google
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
  );
}
