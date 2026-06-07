/**
 * @deprecated Moved to deprecated route tree in V3.4.
 */
'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle } from 'lucide-react';

export default function AudioSettingsPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [deleting, setDeleting] = useState(false);
    const [deleted, setDeleted] = useState(false);

    const handleDeleteVoiceData = async () => {
        if (!user) return;
        setDeleting(true);
        try {
            const res = await fetch('/api/user/delete-voice-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            if (!res.ok) throw new Error('delete failed');
            setDeleted(true);
            toast({ title: 'Datos de voz eliminados', description: 'Todos tus archivos de audio han sido eliminados permanentemente.' });
        } catch {
            toast({ title: 'Error', description: 'No se pudieron eliminar los datos de voz.', variant: 'destructive' });
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <SectionTitle title="Audio y Privacidad 🎙️" subtitle="Controla cómo se usan tus datos de voz" />

            <Card>
                <CardHeader>
                    <CardTitle>Transcripción Automática</CardTitle>
                    <CardDescription>Permitir que Alora transcriba tus mensajes de voz para mostrarlos como texto.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <span className="text-sm font-medium">Habilitar Transcripción</span>
                    <Switch defaultChecked />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Análisis de Emociones</CardTitle>
                    <CardDescription>Etiquetar mensajes de voz con indicadores de estado de ánimo para mejorar la comunicación.</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <span className="text-sm font-medium">Habilitar Insights Emocionales</span>
                    <Switch defaultChecked />
                </CardContent>
            </Card>

            <Card className="border-red-100">
                <CardHeader>
                    <CardTitle className="text-red-500">Zona de Peligro</CardTitle>
                </CardHeader>
                <CardContent>
                    {deleted ? (
                        <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="text-sm font-medium">Datos de voz eliminados permanentemente</span>
                        </div>
                    ) : (
                        <>
                            <Button variant="destructive" className="w-full" onClick={handleDeleteVoiceData} disabled={deleting}>
                                {deleting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Eliminando...</> : 'Eliminar todos mis datos de voz'}
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">Esta acción es irreversible y eliminará todos los audios enviados y metadatos asociados.</p>
                        </>
                    )}
                </CardContent>
            </Card>

            <div className="text-center text-xs text-gray-400 mt-8">
                <a href="/docs/voice-privacy" className="underline">Leer Política de Privacidad de Voz Completa</a>
            </div>
        </div>
    );
}

