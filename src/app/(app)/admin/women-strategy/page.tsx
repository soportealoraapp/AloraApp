'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, TrendingUp, Target, Loader2 } from 'lucide-react';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

interface WomenStrategyData {
    totalWomen: number;
    activeWomen: number;
    verifiedWomen: number;
    referredWomen: number;
    retentionD7: number;
    conversionToActive: number;
    verificationRate: number;
}

export default function WomenStrategyPage() {
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
                referredWomen: 0,
                retentionD7: retention.retentionD7 || 0,
                conversionToActive: Math.round(retention.retentionD1 || 0),
                verificationRate: retention.verificationRate || 0,
            });
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="md:pl-60 p-6 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!data) {
        return <div className="md:pl-60 p-6">No se pudieron cargar los datos</div>;
    }

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Estrategia 1000 Mujeres" subtitle="Panel operativo para crecimiento femenino" />

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
                            <Target className="h-4 w-4 text-purple-500" /> Meta 1000
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{Math.min(100, Math.round(data.activeWomen / 10))}%</p>
                        <p className="text-xs text-muted-foreground">{data.activeWomen}/1000 activas</p>
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
