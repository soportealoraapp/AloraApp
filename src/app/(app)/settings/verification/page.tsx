'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Clock, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { VerificationUpload } from '@/components/verification/VerificationUpload';

const GESTURES = [
    { id: 'smile', emoji: '😊', label: 'Sonríe' },
    { id: 'v_sign', emoji: '✌️', label: 'Haz una V' },
    { id: 'thumbs_up', emoji: '👍', label: 'Pulgar arriba' },
    { id: 'open_palm', emoji: '🤚', label: 'Mano abierta' },
];

export default function VerificationPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [showUpload, setShowUpload] = useState(false);
    const [selectedGesture, setSelectedGesture] = useState<string | null>(null);
    const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'approved' | 'rejected'>('unverified');
    const [rejectionReason, setRejectionReason] = useState<string | null>(null);
    const [statusLoading, setStatusLoading] = useState(true);

    useEffect(() => {
        fetch('/api/verification/status')
            .then(r => r.json())
            .then(data => {
                setVerificationStatus(data.status || 'unverified');
                setRejectionReason(data.rejectionReason || null);
            })
            .catch(() => setVerificationStatus('unverified'))
            .finally(() => setStatusLoading(false));
    }, []);

    const handleVerificationComplete = () => {
        setVerificationStatus('pending');
        setShowUpload(false);
    };

    const isVerified = profile?.isVerified;

    const getRandomGesture = () => {
        const gesture = GESTURES[Math.floor(Math.random() * GESTURES.length)];
        setSelectedGesture(gesture.id);
    };

    useEffect(() => {
        getRandomGesture();
    }, []);

    if (showUpload && selectedGesture) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Verificación</h1>
                </header>
                <main className="p-4 max-w-lg mx-auto">
                    <VerificationUpload
                        gesture={selectedGesture}
                        onComplete={handleVerificationComplete}
                    />
                </main>
            </div>
        );
    }

    const currentGesture = GESTURES.find(g => g.id === selectedGesture);

    if (statusLoading) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Verificación de Identidad</h1>
                </header>
                <main className="p-4 max-w-lg mx-auto flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Verificación de Identidad</h1>
            </header>

            <main className="p-4 max-w-lg mx-auto space-y-6">
                {verificationStatus === 'rejected' ? (
                    <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-3">
                                    <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-red-800 dark:text-red-300">Verificación rechazada</p>
                                    {rejectionReason && (
                                        <p className="text-sm text-red-600 dark:text-red-400">{rejectionReason}</p>
                                    )}
                                </div>
                            </div>
                            <Button onClick={() => setShowUpload(true)} variant="outline" className="w-full">
                                Reintentar verificación
                            </Button>
                        </CardContent>
                    </Card>
                ) : (verificationStatus === 'pending' || verificationStatus === 'approved') && !isVerified ? (
                    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/30">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-3">
                                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="font-bold text-amber-800 dark:text-amber-300">Verificación en revisión</p>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    Estamos revisando tu identidad. Te notificaremos en 24-48 horas.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : isVerified || verificationStatus === 'approved' ? (
                    <Card className="border-green-100 dark:border-green-800 bg-green-50/50 dark:bg-green-950/30">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 dark:bg-green-900/50 p-3">
                                <ShieldCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-bold text-green-800 dark:text-green-300">Identidad verificada</p>
                                <p className="text-sm text-green-600 dark:text-green-400">
                                    Tienes el badge de verificación en tu perfil.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Verifica tu identidad</CardTitle>
                                <CardDescription>
                                    Obtén el badge azul de verificación para aumentar la confianza en tus conexiones.
                                </CardDescription>
                                <div className="bg-primary/5 rounded-lg p-3 mt-2">
                                    <p className="text-xs font-medium text-primary">Los perfiles verificados aparecen primero en Discover y reciben hasta 3× más matches.</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg">{currentGesture?.emoji}</span>
                                        <div>
                                            <p className="font-medium text-sm">Paso 1: Haz el gesto</p>
                                            <p className="text-xs text-muted-foreground">
                                                Haz <strong>{currentGesture?.label}</strong> en tu selfie
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mt-1 h-6 px-2 text-xs"
                                                onClick={getRandomGesture}
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Cambiar gesto
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg">📸</span>
                                        <div>
                                            <p className="font-medium text-sm">Paso 2: Toma la selfie</p>
                                            <p className="text-xs text-muted-foreground">Usa la cámara frontal</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-lg">✅</span>
                                        <div>
                                            <p className="font-medium text-sm">Paso 3: Revisión humana</p>
                                            <p className="text-xs text-muted-foreground">Nuestro equipo revisa en 24-48 horas</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-primary/5 rounded-xl p-4 text-center">
                                    <p className="text-2xl mb-2">{currentGesture?.emoji}</p>
                                    <p className="font-bold text-lg">{currentGesture?.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Haz este gesto en tu selfie</p>
                                </div>

                                <Button onClick={() => setShowUpload(true)} className="w-full">
                                    Tomar selfie
                                </Button>

                                <p className="text-[10px] text-center text-muted-foreground">
                                    Tu selfie nunca se muestra en tu perfil. Solo se usa para verificación.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Beneficios de la verificación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        Badge de verificación visible en tu perfil
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        Mayor visibilidad en descubrimientos (+20 puntos trust)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                                        Mayor confianza en tus matches
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
