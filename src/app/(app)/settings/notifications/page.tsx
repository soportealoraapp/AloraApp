
"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
    const router = useRouter();

    const notificationSettings = [
        { id: "new-match", label: "Nuevos 'matches'", description: "Cuando alguien nuevo hace 'match' contigo." },
        { id: "new-message", label: "Nuevos mensajes", description: "Cuando recibes un nuevo mensaje." },
        { id: "profile-view", label: "Visitas a tu perfil", description: "Cuando alguien visita tu perfil." },
        { id: "promotions", label: "Promociones y noticias", description: "Recibe noticias y ofertas de Alora." },
    ];

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Notificaciones</h1>
            </header>
            <main className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones Push</CardTitle>
                        <CardDescription>Elige cómo quieres que te notifiquemos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 divide-y">
                        {notificationSettings.map(setting => (
                            <div key={setting.id} className="flex items-center justify-between pt-4 first:pt-0">
                                <div className="flex-grow">
                                    <p className="font-medium">{setting.label}</p>
                                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                                </div>
                                <Switch id={setting.id} defaultChecked={setting.id !== 'promotions'} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
