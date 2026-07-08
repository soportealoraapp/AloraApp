"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, FileText, HelpCircle, Mail, Palette, Shield, User, LogOut, Loader2, Plane, Settings } from "lucide-react";
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsSectionLink } from '@/components/settings/SettingsSectionLink';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SettingsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signOut, user } = useAuth();
    const { toast } = useToast();
    const [loggingOut, setLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    useEffect(() => {
        const spotify = searchParams.get('spotify');
        if (spotify === 'connected') {
            toast({ title: 'Spotify conectado', description: 'Tu cuenta de Spotify se vinculó correctamente.' });
        } else if (spotify === 'error') {
            const reason = searchParams.get('reason') || 'unknown';
            toast({ title: 'Error al conectar Spotify', description: reason === 'user_denied' ? 'Conexión cancelada.' : 'No se pudo conectar. Intenta de nuevo.', variant: 'destructive' });
        }
    }, [searchParams, toast]);

    if (!user) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            router.replace('/login');
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo cerrar la sesión",
            });
        } finally {
            setLoggingOut(false);
        }
    };

    return (
        <div className="min-h-dvh bg-background">
            {/* Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur-md pt-safe"
                style={{ borderBottomColor: 'hsl(var(--border) / 0.5)' }}
            >
                {/* Gradient top border accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)' }}
                />
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver" className="rounded-xl">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-headline font-bold text-gradient">Configuración</h1>
                </div>
            </header>

            <main className="mx-auto max-w-3xl space-y-5 px-4 py-4 sm:px-6 sm:py-5">
                {/* Cuenta */}
                <Card className="border-border/40 bg-card/60 shadow-sm rounded-3xl overflow-hidden backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="h-1.5 w-3 rounded-full bg-primary" />
                            Cuenta
                        </CardTitle>
                        <CardDescription className="text-xs">Edita tu perfil y tus preferencias principales.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-border/20 p-2">
                        <SettingsSectionLink 
                            href="/profile/edit" 
                            icon={<User />} 
                            label="Editar Perfil" 
                            description="Actualiza tu información personal" 
                            bubbleBg="bg-primary/10 border-primary/20 text-primary"
                        />
                        <SettingsSectionLink 
                            href="/settings/notifications" 
                            icon={<Bell />} 
                            label="Notificaciones" 
                            description="Controla alertas y recordatorios" 
                            bubbleBg="bg-pink-500/10 border-pink-500/20 text-pink-500"
                        />
                        <SettingsSectionLink 
                            href="/settings/privacy" 
                            icon={<Shield />} 
                            label="Privacidad y Seguridad" 
                            description="Gestiona tu visibilidad y datos" 
                            bubbleBg="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                        />
                        <SettingsSectionLink 
                            href="/settings/safety" 
                            icon={<Shield />} 
                            label="Centro de Seguridad" 
                            description="Revisa recomendaciones de seguridad" 
                            bubbleBg="bg-destructive/10 border-destructive/20 text-destructive"
                        />
                        <SettingsSectionLink 
                            href="/settings/travel" 
                            icon={<Plane />} 
                            label="Modo Viaje" 
                            description="Activa tu perfil temporal" 
                            badge="Plus" 
                            bubbleBg="bg-blue-500/10 border-blue-500/20 text-blue-500"
                        />
                    </CardContent>
                </Card>

                {/* Apariencia */}
                <Card className="border-border/40 bg-card/60 shadow-sm rounded-3xl overflow-hidden backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="h-1.5 w-3 rounded-full bg-violet-400" />
                            Apariencia
                        </CardTitle>
                        <CardDescription className="text-xs">Ajusta el look general de la app.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="flex items-center justify-between rounded-2xl p-3 hover:bg-secondary/40 transition-colors">
                            <div className="flex items-center gap-3.5">
                                <div className="h-10 w-10 rounded-xl border flex items-center justify-center bg-violet-500/10 border-violet-500/20 text-violet-500">
                                    <Palette className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="text-sm font-semibold text-foreground">Tema de la aplicación</span>
                                    <p className="text-[11px] text-muted-foreground/80">Cambia entre claro, oscuro y sistema</p>
                                </div>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>

                {/* Soporte y Legal */}
                <Card className="border-border/40 bg-card/60 shadow-sm rounded-3xl overflow-hidden backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <span className="h-1.5 w-3 rounded-full bg-amber-400" />
                            Soporte y Legal
                        </CardTitle>
                        <CardDescription className="text-xs">Ayuda, contacto y documentación legal.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-border/20 p-2">
                        <SettingsSectionLink 
                            href="/support" 
                            icon={<HelpCircle />} 
                            label="Ayuda y Soporte" 
                            description="Encuentra respuestas rápidas" 
                            bubbleBg="bg-purple-500/10 border-purple-500/20 text-purple-500"
                        />
                        <SettingsSectionLink 
                            href="/contact" 
                            icon={<Mail />} 
                            label="Contacto" 
                            description="Envíanos un mensaje" 
                            bubbleBg="bg-amber-500/10 border-amber-500/20 text-amber-500"
                        />
                        <SettingsSectionLink 
                            href="/terms" 
                            icon={<FileText />} 
                            label="Términos y Condiciones" 
                            description="Revisa las reglas de uso" 
                            bubbleBg="bg-gray-500/10 border-gray-500/20 text-gray-500"
                        />
                        <SettingsSectionLink 
                            href="/privacy" 
                            icon={<FileText />} 
                            label="Política de Privacidad" 
                            description="Consulta cómo tratamos tus datos" 
                            bubbleBg="bg-gray-500/10 border-gray-500/20 text-gray-500"
                        />
                    </CardContent>
                </Card>

                <div className="pt-4 space-y-3">
                    <Button
                        variant="outline"
                        className="w-full text-destructive border-destructive/30 hover:bg-destructive/5 h-12 rounded-xl"
                        onClick={() => router.push('/settings/privacy')}
                    >
                        Gestionar cuenta y eliminar
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full h-12 rounded-xl"
                        onClick={() => setShowLogoutConfirm(true)}
                        disabled={loggingOut}
                    >
                        {loggingOut ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cerrando sesión...
                            </>
                        ) : (
                            <>
                                <LogOut className="h-4 w-4 mr-2" />
                                Cerrar Sesión
                            </>
                        )}
                    </Button>
                </div>
            </main>

            <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
                <AlertDialogContent className="rounded-3xl border-border/40 max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-lg font-bold">¿Cerrar sesión?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            Se cerrará tu sesión y serás redirigido a la pantalla de inicio de sesión.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-2 mt-4">
                        <AlertDialogCancel disabled={loggingOut} className="flex-1 rounded-xl h-11 border-border/60">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} disabled={loggingOut} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-11">
                            {loggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Cerrar Sesión
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
