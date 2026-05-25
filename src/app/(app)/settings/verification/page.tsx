'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ShieldCheck, Clock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { VerificationUpload } from '@/components/verification/VerificationUpload';

export default function VerificationPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [showUpload, setShowUpload] = useState(false);

    const isVerified = profile?.isVerified;
    const verificationStatus = profile?.verificationStatus;

    if (showUpload) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Button variant="ghost" size="icon" onClick={() => setShowUpload(false)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Verificación</h1>
                </header>
                <main className="p-4 max-w-lg mx-auto">
                    <VerificationUpload onComplete={() => setShowUpload(false)} />
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
                {isVerified ? (
                    <Card className="border-green-100 bg-green-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 p-3">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold text-green-800">Identidad verificada</p>
                                <p className="text-sm text-green-600">
                                    Tienes el badge de verificación en tu perfil.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Verifica tu identidad</CardTitle>
                            <CardDescription>
                                Obtén el badge azul de verificación para aumentar la confianza en tus conexiones.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-2xl bg-muted/50 p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CameraIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Selfie en vivo</p>
                                        <p className="text-xs text-muted-foreground">Toma una selfie con tu cámara frontal</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Revisión humana</p>
                                        <p className="text-xs text-muted-foreground">Nuestro equipo revisa tu solicitud en 24-48 horas</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-sm">Privacidad garantizada</p>
                                        <p className="text-xs text-muted-foreground">Tu selfie nunca se muestra en tu perfil</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => setShowUpload(true)} className="w-full">
                                Iniciar verificación
                            </Button>

                            <p className="text-[10px] text-center text-muted-foreground">
                                Al verificar tu identidad, aceptas que revisemos tu selfie para confirmar tu identidad.
                            </p>
                        </CardContent>
                    </Card>
                )}

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
                                Mayor visibilidad en descubrimientos
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                                Mayor confianza en tus matches
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    );
}
