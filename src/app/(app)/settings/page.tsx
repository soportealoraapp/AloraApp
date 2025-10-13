
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, ChevronRight, FileText, HelpCircle, Palette, Shield, User } from "lucide-react";
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
    const router = useRouter();

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Configuración</h1>
            </header>
            <main className="p-4 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Configuración de la Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <Link href="/profile/edit">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                                <div className="flex items-center gap-3">
                                <User className="w-5 h-5 text-muted-foreground" />
                                <span>Editar Perfil</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/settings/notifications">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                                <div className="flex items-center gap-3">
                                <Bell className="w-5 h-5 text-muted-foreground" />
                                <span>Notificaciones</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="/settings/privacy">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                                <div className="flex items-center gap-3">
                                <Shield className="w-5 h-5 text-muted-foreground" />
                                <span>Privacidad y Seguridad</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Apariencia</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-3 rounded-lg -mx-3">
                             <div className="flex items-center gap-3">
                                <Palette className="w-5 h-5 text-muted-foreground" />
                                <span>Tema de la aplicación</span>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>


                 <Card>
                    <CardHeader>
                        <CardTitle>Soporte y Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="divide-y">
                        <Link href="#">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                                <div className="flex items-center gap-3">
                                <HelpCircle className="w-5 h-5 text-muted-foreground" />
                                <span>Ayuda y Soporte</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                        <Link href="#">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                                <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <span>Términos y Condiciones</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </div>
                        </Link>
                    </CardContent>
                </Card>

                <div className="pt-4">
                    <Button variant="destructive" className="w-full">Cerrar Sesión</Button>
                </div>
            </main>
        </div>
    );
}
