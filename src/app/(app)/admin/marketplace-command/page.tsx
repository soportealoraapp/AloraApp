'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, MessageCircle, Heart, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminData = Record<string, any>;

interface CommandCenterData {
    marketplace: AdminData;
    retention: AdminData;
    activation: AdminData;
    alerts: { severity?: string; message: string }[];
}

export default function MarketplaceCommandPage() {
    const router = useRouter();
    const [data, setData] = useState<CommandCenterData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/marketplace-health').then(r => r.json()),
            fetch('/api/admin/female-retention').then(r => r.json()),
            fetch('/api/admin/activation-funnel').then(r => r.json()),
        ]).then(([marketplace, retention, activation]) => {
            const derivedAlerts: { severity: string; message: string }[] = [];

            if (marketplace.genderAlert === 'critical_imbalance') {
                derivedAlerts.push({ severity: 'high', message: 'Desequilibrio de género crítico. La proporción requiere acción inmediata.' });
            } else if (marketplace.genderAlert === 'moderate_imbalance') {
                derivedAlerts.push({ severity: 'medium', message: 'Desequilibrio de género moderado. Monitorear tendencia.' });
            }

            if (retention.retentionD7 !== undefined && retention.retentionD7 < 40) {
                derivedAlerts.push({ severity: 'high', message: `Retención D7 baja: ${retention.retentionD7}%. Evaluar experiencia de onboarding.` });
            } else if (retention.retentionD7 !== undefined && retention.retentionD7 < 60) {
                derivedAlerts.push({ severity: 'medium', message: `Retención D7 moderada: ${retention.retentionD7}%. Optimizar engagement.` });
            }

            if (activation?.funnel?.steps) {
                const onboardingStep = activation.funnel.steps.find((s: any) => s.label?.includes('Onboarding'));
                if (onboardingStep && onboardingStep.conversionRate < 50) {
                    derivedAlerts.push({ severity: 'medium', message: 'Tasa de completitud de onboarding por debajo del 50%.' });
                }
            }

            setData({
                marketplace,
                retention,
                activation,
                alerts: derivedAlerts,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="md:pl-sidebar p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return (
            <div className="md:pl-sidebar p-6 flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-muted-foreground">No se pudieron cargar los datos</p>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                </Button>
            </div>
        );
    }

    const { marketplace, retention } = data;

    return (
        <div className="md:pl-sidebar p-6 space-y-6">
            <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
                <SectionTitle title="Centro de Comandos del Marketplace" subtitle="Vista unificada del estado del marketplace" />
            </div>

            {/* Health Status */}
            <Card className={`${marketplace.genderAlert === 'healthy' ? 'border-green-200 dark:border-green-800/30 bg-green-50 dark:bg-green-900/20' : marketplace.genderAlert === 'moderate_imbalance' ? 'border-yellow-200 dark:border-yellow-800/30 bg-yellow-50 dark:bg-yellow-900/20' : 'border-red-200 dark:border-red-800/30 bg-red-50 dark:bg-red-900/20'}`}>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-6 w-6" />
                            <div>
                                <h3 className="font-bold">Estado del Marketplace</h3>
                                <p className="text-sm">
                                    {marketplace.genderAlert === 'healthy' ? 'La comunidad está sana' :
                                     marketplace.genderAlert === 'moderate_imbalance' ? 'Desequilibrio moderado detectado' :
                                     'Desequilibrio crítico — acción requerida'}
                                </p>
                            </div>
                        </div>
                        <Badge className={
                            marketplace.genderAlert === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            marketplace.genderAlert === 'moderate_imbalance' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        }>
                            {marketplace.genderRatio}:1
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" /> Hombres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{marketplace.maleUsers}</p>
                        <p className="text-xs text-muted-foreground">{marketplace.activeUsers} activos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-pink-500" /> Mujeres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{marketplace.femaleUsers}</p>
                        <p className="text-xs text-muted-foreground">{retention.activeFemaleD7} activas D7</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" /> Conversaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{marketplace.conversationRate}%</p>
                        <p className="text-xs text-muted-foreground">tasa de conversación</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Heart className="h-4 w-4 text-red-500" /> Respuesta
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{marketplace.responseRate}%</p>
                        <p className="text-xs text-muted-foreground">tasa de respuesta</p>
                    </CardContent>
                </Card>
            </div>

            {/* Retention Comparison */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Retención Femenina vs Masculina</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D1 Mujeres</span>
                                <span className="font-bold">{retention.retentionD1}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D1 Hombres</span>
                                <span className="font-bold">{retention.vsMale.d1}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D7 Mujeres</span>
                                <span className="font-bold">{retention.retentionD7}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D7 Hombres</span>
                                <span className="font-bold">{retention.vsMale.d7}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D30 Mujeres</span>
                                <span className="font-bold">{retention.retentionD30}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">D30 Hombres</span>
                                <span className="font-bold">{retention.vsMale.d30}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Verificación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Mujeres verificadas</span>
                                <span className="font-bold">{retention.verificationRate}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Usuarios premium</span>
                                <span className="font-bold">{marketplace.premiumUsers}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm">Tasa de ghosting</span>
                                <span className="font-bold">{marketplace.ghostingRate}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts */}
            {data.alerts.length > 0 && (
                <Card className="border-red-200">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" /> Alertas Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.alerts.map((alert, i: number) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <Badge variant={alert.severity === 'high' ? 'destructive' : 'outline'}>
                                        {alert.severity}
                                    </Badge>
                                    {alert.message}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
