"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { preferencesService } from "@/lib/firebase/preferences-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Shield, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradePrompt } from "@/components/premium/UpgradePrompt";

export default function PrivacySettingsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [incognitoMode, setIncognitoMode] = useState(false);
    const [showMe, setShowMe] = useState(true);
    const [verifiedOnly, setVerifiedOnly] = useState(true);

    useEffect(() => {
        async function loadPreferences() {
            if (!user) return;

            try {
                const prefs = await preferencesService.getPreferences(user.id);
                setIncognitoMode(prefs.incognito);
                setShowMe(prefs.showMe);
                setVerifiedOnly(false); // verifiedOnly is not stored in preferences
            } catch (error) {
                console.error("Error loading preferences:", error);
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [user]);

    const handleToggleIncognito = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            await preferencesService.toggleIncognito(user.id);
            setIncognitoMode(value);

            toast({
                title: value ? "Modo Incógnito Activado" : "Modo Incógnito Desactivado",
                description: value
                    ? "Tu perfil no aparecerá en descubrir"
                    : "Tu perfil será visible en descubrir",
            });
        } catch (error) {
            console.error("Error toggling incognito:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar el modo incógnito",
            });
            setIncognitoMode(!value);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleShowMe = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            await preferencesService.toggleShowMe(user.id);
            setShowMe(value);

            toast({
                title: value ? "Perfil Visible" : "Perfil Oculto",
                description: value
                    ? "Aparecerás en la sección descubrir"
                    : "No aparecerás en descubrir",
            });
        } catch (error) {
            console.error("Error toggling show me:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar la visibilidad",
            });
            setShowMe(!value);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleVerifiedOnly = async (value: boolean) => {
        if (!user) return;

        setSaving(true);
        try {
            // verifiedOnly is handled by DiscoverFilters, not stored in backend preferences
            setVerifiedOnly(value);

            toast({
                title: value ? "Solo Verificados" : "Todos los Perfiles",
                description: value
                    ? "Solo verás perfiles verificados"
                    : "Verás todos los perfiles",
            });
        } catch (error) {
            console.error("Error toggling verified only:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cambiar la preferencia",
            });
            setVerifiedOnly(!value);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
                </main>
            </div>
        );
    }

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">
                    Privacidad y Seguridad
                </h1>
            </header>

            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Visibilidad del Perfil
                        </CardTitle>
                        <CardDescription>
                            Controla quién puede verte en Alora
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Modo Incógnito</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Tu perfil no aparecerá en descubrir, solo tus matches actuales te verán
                                </p>
                            </div>
                            <Switch
                                checked={incognitoMode}
                                onCheckedChange={handleToggleIncognito}
                                disabled={saving}
                            />
                        </div>

                        {user && (user as any).user_metadata?.subscriptionStatus !== 'plus' && (
                            <UpgradePrompt trigger="incognito" />
                        )}

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Mostrar mi perfil en Descubrir</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Aparecer en la sección de descubrir para que otros te encuentren
                                </p>
                            </div>
                            <Switch
                                checked={showMe}
                                onCheckedChange={handleToggleShowMe}
                                disabled={saving}
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Shield className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-medium">Solo mostrar perfiles verificados</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Solo ver perfiles con verificación de identidad
                                </p>
                            </div>
                            <Switch
                                checked={verifiedOnly}
                                onCheckedChange={handleToggleVerifiedOnly}
                                disabled={saving}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gestionar Privacidad</CardTitle>
                        <CardDescription>
                            Administra tus bloqueos y perfiles ocultos
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/settings/privacy/blocked">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                                <div>
                                    <p className="font-medium">Contactos Bloqueados</p>
                                    <p className="text-sm text-muted-foreground">
                                        Ver y gestionar usuarios bloqueados
                                    </p>
                                </div>
                                <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                            </div>
                        </Link>

                        <Link href="/settings/privacy/rejected">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                                <div>
                                    <p className="font-medium">Perfiles Ocultos</p>
                                    <p className="text-sm text-muted-foreground">
                                        Perfiles que rechazaste
                                    </p>
                                </div>
                                <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-destructive">Zona Peligrosa</CardTitle>
                        <CardDescription>
                            Acciones irreversibles
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                            Cambiar Contraseña
                        </Button>
                        <Button variant="destructive" className="w-full">
                            Eliminar Cuenta
                        </Button>
                    </CardContent>
                </Card>

                {saving && (
                    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <p className="text-sm">Guardando cambios...</p>
                    </div>
                )}
            </main>
        </div>
    );
}
