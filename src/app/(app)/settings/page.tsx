"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, FileText, HelpCircle, Mail, Palette, Shield, User, LogOut, Loader2, Plane } from "lucide-react";
import { ThemeToggle } from '@/components/theme-toggle';
import { SettingsSectionLink } from '@/components/settings/SettingsSectionLink';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export default function SettingsPage() {
    const router = useRouter();
    const { signOut } = useAuth();
    const { toast } = useToast();
    const [loggingOut, setLoggingOut] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            router.push('/login');
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
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Configuración</h1>
            </header>
            <main className="mx-auto max-w-3xl p-4 space-y-6 sm:p-6">
                 <Card className="border-0 bg-card/80 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Cuenta</CardTitle>
                        <CardDescription className="text-xs">Edita tu perfil y tus preferencias principales.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-muted/30 p-0">
                        <SettingsSectionLink href="/profile/edit" icon={<User className="h-5 w-5" />} label="Editar Perfil" description="Actualiza tu información personal" />
                        <SettingsSectionLink href="/settings/notifications" icon={<Bell className="h-5 w-5" />} label="Notificaciones" description="Controla alertas y recordatorios" />
                        <SettingsSectionLink href="/settings/privacy" icon={<Shield className="h-5 w-5" />} label="Privacidad y Seguridad" description="Gestiona tu visibilidad y datos" />
                        <SettingsSectionLink href="/settings/safety" icon={<Shield className="h-5 w-5 text-destructive" />} label="Centro de Seguridad" description="Revisa recomendaciones de seguridad" iconClassName="text-destructive" />
                        <SettingsSectionLink href="/settings/travel" icon={<Plane className="h-5 w-5 text-blue-500" />} label="Modo Viaje" description="Activa tu perfil temporal" badge="Plus" />
                    </CardContent>
                </Card>

                 <Card className="border-0 bg-card/80 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Apariencia</CardTitle>
                        <CardDescription className="text-xs">Ajusta el look general de la app.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-xl p-3 -mx-3 hover:bg-muted/30 transition-colors">
                             <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5 text-muted-foreground" />
                                <span>Tema de la aplicación</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>


                         <Card className="border-0 bg-card/80 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Soporte y Legal</CardTitle>
                        <CardDescription className="text-xs">Ayuda, contacto y documentación legal.</CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y divide-muted/30 p-0">
                        <SettingsSectionLink href="/support" icon={<HelpCircle className="h-5 w-5" />} label="Ayuda y Soporte" description="Encuentra respuestas rápidas" />
                        <SettingsSectionLink href="/contact" icon={<Mail className="h-5 w-5" />} label="Contacto" description="Envíanos un mensaje" />
                        <SettingsSectionLink href="/terms" icon={<FileText className="h-5 w-5" />} label="Términos y Condiciones" description="Revisa las reglas de uso" />
                        <SettingsSectionLink href="/privacy" icon={<FileText className="h-5 w-5" />} label="Política de Privacidad" description="Consulta cómo tratamos tus datos" />
                    </CardContent>
                </Card>

                <div className="pt-4">
                    <Button
                        variant="destructive"
                        className="w-full"
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se cerrará tu sesión y serás redirigido a la pantalla de inicio de sesión.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loggingOut}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLogout} disabled={loggingOut} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {loggingOut ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Cerrar Sesión
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
