

"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Ban, ShieldCheck, UserX, History } from "lucide-react";
import Link from 'next/link';

export default function PrivacyPage() {
    const router = useRouter();

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Privacidad y Seguridad</h1>
            </header>
            <main className="p-4 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Visibilidad del Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 divide-y">
                         <div className="flex items-center justify-between pt-4 first:pt-0">
                            <div>
                                <p className="font-medium">Modo Incógnito</p>
                                <p className="text-sm text-muted-foreground">Solo las personas que te gustan pueden ver tu perfil.</p>
                            </div>
                            <Switch id="incognito-mode" />
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div>
                                <p className="font-medium">Mostrar mi perfil en Descubrir</p>
                                <p className="text-sm text-muted-foreground">Desactiva esto si quieres tomarte un descanso.</p>
                            </div>
                            <Switch id="show-on-discover" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Gestión de Perfiles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start gap-2" asChild>
                           <Link href="/settings/privacy/blocked">
                             <UserX className="h-5 w-5 text-muted-foreground"/>
                             Contactos Bloqueados
                           </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2" asChild>
                           <Link href="/settings/privacy/rejected">
                             <History className="h-5 w-5 text-muted-foreground"/>
                             Perfiles Ocultos
                           </Link>
                        </Button>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Seguridad de la Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <ShieldCheck className="h-5 w-5 text-muted-foreground"/>
                            Cambiar Contraseña
                        </Button>
                    </CardContent>
                </Card>

                 <div className="pt-4">
                    <Button variant="destructive" className="w-full justify-start gap-2">
                        <Ban className="h-5 w-5"/>
                        Eliminar mi cuenta
                    </Button>
                </div>
            </main>
        </div>
    );
}
