"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { isSoundEnabled, setSoundEnabled as setSoundPref } from '@/lib/sounds';

interface NotificationPrefs {
    matches: boolean;
    messages: boolean;
    profileViews: boolean;
    promotions: boolean;
    dailyQuestion: boolean;
    streakReminder: boolean;
    readReceipts: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [soundOn, setSoundOn] = useState(true);

    useEffect(() => {
        fetchPrefs();
        setSoundOn(isSoundEnabled());
    }, []);

    const fetchPrefs = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/notifications/preferences');
            if (res.ok) {
                const data = await res.json();
                setPrefs(data);
            } else {
                setError('No se pudieron cargar las preferencias');
            }
        } catch (error) {
            setError('No se pudieron cargar las preferencias');
        } finally {
            setLoading(false);
        }
    };

    const togglePref = async (field: keyof NotificationPrefs, value: boolean) => {
        if (!prefs) return;
        setUpdating(field);
        try {
            const res = await fetch('/api/notifications/preferences', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) throw new Error('Error updating');

            setPrefs({ ...prefs, [field]: value });
            toast({ title: 'Preferencia actualizada' });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <div className="h-dvh overflow-y-auto">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Notificaciones</h1>
                </header>
                <main className="p-4">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-48" />
                                    </div>
                                    <Skeleton className="h-5 w-10 rounded-full" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-dvh overflow-y-auto">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Notificaciones</h1>
                </header>
                <main className="p-4">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-destructive font-medium text-center">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => fetchPrefs()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    const settings = [
        { key: 'matches' as const, label: "Nuevos matches", description: "Cuando alguien hace match contigo." },
        { key: 'messages' as const, label: "Nuevos mensajes", description: "Cuando recibes un nuevo mensaje." },
        { key: 'profileViews' as const, label: "Visitas a tu perfil", description: "Cuando alguien visita tu perfil." },
        { key: 'dailyQuestion' as const, label: "Pregunta del día", description: "Recordatorio de la pregunta diaria." },
        { key: 'streakReminder' as const, label: "Recordatorio de racha", description: "No pierdas tu racha diaria." },
        { key: 'promotions' as const, label: "Promociones", description: "Noticias y ofertas de Alora." },
        { key: 'readReceipts' as const, label: "Confirmaciones de lectura", description: "Mostrar cuando alguien lee tus mensajes." },
    ];

        return (
            <div className="h-dvh overflow-y-auto">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
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
                        {settings.map(setting => (
                            <div key={setting.key} className="flex items-center justify-between pt-4 first:pt-0">
                                <div className="flex-grow">
                                    <p className="font-medium">{setting.label}</p>
                                    <p className="text-sm text-muted-foreground">{setting.description}</p>
                                </div>
                                <Switch
                                    checked={prefs?.[setting.key] ?? false}
                                    onCheckedChange={(v) => togglePref(setting.key, v)}
                                    disabled={updating === setting.key}
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle>Sonidos</CardTitle>
                        <CardDescription>Controla los sonidos de la aplicación.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex-grow">
                                <p className="font-medium">Sonidos de la app</p>
                                <p className="text-sm text-muted-foreground">Reproducir sonidos al dar like, recibir matches y mensajes.</p>
                            </div>
                            <Switch
                                checked={soundOn}
                                onCheckedChange={(v) => {
                                    setSoundOn(v);
                                    setSoundPref(v);
                                    toast({ title: v ? 'Sonidos activados' : 'Sonidos desactivados' });
                                }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
