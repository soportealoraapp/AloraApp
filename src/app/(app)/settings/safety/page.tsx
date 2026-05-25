'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info, ExternalLink, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';

export default function SafetyCenterPage() {
    const router = useRouter();
    const { user, profile } = useAuth();

    const tips = [
        {
            icon: Shield,
            title: 'Nunca compartas información financiera',
            description: 'Alora nunca te pedirá tu número de tarjeta, contraseñas o datos bancarios fuera de nuestros canales oficiales de pago.',
        },
        {
            icon: Info,
            title: 'Conócete en un lugar público',
            description: 'Para tu primera cita, elige un lugar concurrido. Informa a una amiga o familiar de dónde vas.',
        },
        {
            icon: ShieldCheck,
            title: 'Confía en tu intuición',
            description: 'Si algo no se siente bien, no lo dudes: puedes bloquear y reportar en cualquier momento.',
        },
        {
            icon: AlertTriangle,
            title: 'Verifica antes de confiar',
            description: 'Los perfiles verificados tienen un badge azul. Busca la verificación como señal de autenticidad.',
        },
    ];

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Centro de Seguridad</h1>
            </header>

            <main className="p-4 space-y-6 max-w-2xl mx-auto">
                {/* Trust Status */}
                {profile && (
                    <Card className="border-green-100 bg-green-50/50">
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className="rounded-full bg-green-100 p-3">
                                <ShieldCheck className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="font-bold text-green-800">Tu cuenta está segura</p>
                                <p className="text-sm text-green-600">
                                    {profile.verificationStatus === 'verified'
                                        ? 'Identidad verificada'
                                        : 'Verificación pendiente — recomendamos verificar tu perfil'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Acciones de seguridad
                        </CardTitle>
                        <CardDescription>
                            Herramientas para proteger tu espacio en Alora
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/settings/privacy/rejected">
                            <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Usuarios bloqueados</p>
                                    <p className="text-xs text-muted-foreground">Gestiona tu lista de bloqueados</p>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/settings/verification">
                            <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                                <CheckCircle className="h-5 w-5 text-blue-500" />
                                <div className="text-left">
                                    <p className="font-medium">Verificar mi identidad</p>
                                    <p className="text-xs text-muted-foreground">Obtén tu badge de verificación</p>
                                </div>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Safety Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Consejos de seguridad
                        </CardTitle>
                        <CardDescription>
                            Recomendaciones para una experiencia segura
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {tips.map((tip, i) => (
                            <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                                <div className="rounded-full bg-primary/10 p-2 h-fit">
                                    <tip.icon className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{tip.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{tip.description}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Report History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reportes</CardTitle>
                        <CardDescription>
                            Tus reportes se revisan en un plazo de 24-48 horas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {BRAND_VOICE.safety.reportThankYou}
                        </p>
                    </CardContent>
                </Card>

                <p className="text-xs text-center text-muted-foreground pb-8">
                    Si estás en peligro inmediato, contacta a las autoridades locales.
                    Alora no es un servicio de emergencia.
                </p>
            </main>
        </div>
    );
}
