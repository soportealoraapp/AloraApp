'use client';

import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

export default function AudioSettingsPage() {
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
                    <CardDescription>Permitir que la IA detecte el tono emocional para mejorar la comunicación.</CardDescription>
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
                    <Button variant="destructive" className="w-full">
                        Eliminar todos mis datos de voz
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Esta acción es irreversible y eliminará todos los audios enviados y metadatos asociados.</p>
                </CardContent>
            </Card>

            <div className="text-center text-xs text-gray-400 mt-8">
                <a href="/docs/voice-privacy" className="underline">Leer Política de Privacidad de Voz Completa</a>
            </div>
        </div>
    );
}
