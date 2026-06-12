"use client";

import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface NotificationPrefs {
    matches: boolean;
    messages: boolean;
    profileViews: boolean;
    promotions: boolean;
    dailyQuestion: boolean;
    streakReminder: boolean;
}

export default function NotificationsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchPrefs();
    }, []);

    const fetchPrefs = async () => {
        try {
            const res = await fetch('/api/notifications/preferences');
            const data = await res.json();
            setPrefs(data);
        } catch (error) {
            console.error('Error fetching preferences:', error);
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
            <div className="p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
        );
    }

    const settings = [
        { key: 'matches' as const, label: "Nuevos matches", description: "Cuando alguien hace match contigo." },
        { key: 'messages' as const, label: "Nuevos mensajes", description: "Cuando recibes un nuevo mensaje." },
        { key: 'profileViews' as const, label: "Visitas a tu perfil", description: "Cuando alguien visita tu perfil." },
        { key: 'dailyQuestion' as const, label: "Pregunta del dia", description: "Recordatorio de la pregunta diaria." },
        { key: 'streakReminder' as const, label: "Recordatorio de racha", description: "No pierdas tu racha diaria." },
        { key: 'promotions' as const, label: "Promociones", description: "Noticias y ofertas de Alora." },
    ];

    return (
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Notificaciones</h1>
            </header>
            <main className="p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Notificaciones Push</CardTitle>
                        <CardDescription>Elige como quieres que te notifiquemos.</CardDescription>
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
            </main>
        </div>
    );
}
