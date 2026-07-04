'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, TrendingUp, Target, Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

interface WomenStrategyData {
    totalWomen: number;
    activeWomen: number;
    verifiedWomen: number;
    retentionD7: number;
    conversionToActive: number;
    verificationRate: number;
}

export default function WomenStrategyPage() {
    const router = useRouter();
    const [data, setData] = useState<WomenStrategyData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/female-retention').then(r => r.json()),
            fetch('/api/admin/marketplace-health').then(r => r.json()),
        ]).then(([retention, health]) => {
            setData({
                totalWomen: health.femaleUsers || 0,
                activeWomen: retention.activeFemaleD7 || 0,
                verifiedWomen: Math.round((retention.totalFemale || 0) * (retention.verificationRate || 0) / 100),
                retentionD7: retention.retentionD7 || 0,
                conversionToActive: Math.round(retention.retentionD1 || 0),
                verificationRate: retention.verificationRate || 0,
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

    return (
        <div className="md:pl-sidebar p-6 space-y-6">
            <div className="flex items-center">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-2"><ArrowLeft className="h-4 w-4" /></Button>
                <SectionTitle title="Estrategia 1000 Mujeres" subtitle="Panel operativo para crecimiento femenino" />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4 text-pink-500" /> Total Mujeres
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data.totalWomen}</p>
                        <p className="text-xs text-muted-foreground">registradas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-500" /> Activas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data.activeWomen}</p>
                        <p className="text-xs text-muted-foreground">últimos 7 días</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" /> Retención D7
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data.retentionD7}%</p>
                        <p className="text-xs text-muted-foreground">vuelven en 7 días</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" /> Verificadas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{data.verifiedWomen}</p>
                        <p className="text-xs text-muted-foreground">{data.verificationRate}% de verificación</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Estrategia Recomendada</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm">Invitaciones directas</h4>
                        <p className="text-xs text-muted-foreground">
                            Cada mujer existente invita a 2 amigas. Las invitaciones femeninas generan doble reward.
                        </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm">Experiencia de seguridad</h4>
                        <p className="text-xs text-muted-foreground">
                            El onboarding de seguridad femenina genera confianza desde el primer minuto.
                        </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <h4 className="font-medium text-sm">Verificación prioritaria</h4>
                        <p className="text-xs text-muted-foreground">
                            Procesar verificaciones femeninas primero para generar confianza en la comunidad.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
