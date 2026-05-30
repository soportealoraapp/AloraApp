'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, Lock, Eye, UserX, FileText, AlertTriangle } from 'lucide-react';
import { SectionTitle } from '@/components/ui/custom/SectionTitle';

interface SafetyData {
    overallProtection: 'high' | 'medium' | 'low';
    verificationStatus: string;
    blockedCount: number;
    reportsMade: number;
    privacySettings: { incognito: boolean; showMeInDiscover: boolean; verifiedOnlyFilter: boolean };
    recommendations: string[];
}

export default function SafetyCenterPage() {
    const [data, setData] = useState<SafetyData | null>(null);

    useEffect(() => {
        fetch('/api/safety/status').then(r => r.json()).then(setData).catch(console.error);
    }, []);

    if (!data) return <div className="md:pl-60 p-6">Cargando...</div>;

    const protectionConfig = {
        high: { icon: ShieldCheck, label: 'Tu perfil está protegido', color: 'text-green-600', bg: 'bg-green-50' },
        medium: { icon: Shield, label: 'Protección parcial', color: 'text-yellow-600', bg: 'bg-yellow-50' },
        low: { icon: ShieldAlert, label: 'Recomendamos activar estas medidas', color: 'text-orange-600', bg: 'bg-orange-50' },
    };

    const config = protectionConfig[data.overallProtection];
    const Icon = config.icon;

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <SectionTitle title="Centro de Seguridad" subtitle="Tu seguridad es nuestra prioridad" />

            <Card className={`${config.bg} border-none`}>
                <CardContent className="p-6 flex items-center gap-4">
                    <Icon className={`h-12 w-12 ${config.color}`} />
                    <div>
                        <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
                        <p className="text-sm text-muted-foreground">
                            Nivel de protección: {data.overallProtection === 'high' ? 'Alto' : data.overallProtection === 'medium' ? 'Medio' : 'Bajo'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Privacidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Modo incógnito</span>
                            <Badge variant={data.privacySettings.incognito ? 'default' : 'outline'}>
                                {data.privacySettings.incognito ? 'Activo' : 'Inactivo'}
                            </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span>Visible en descubrir</span>
                            <Badge variant={data.privacySettings.showMeInDiscover ? 'default' : 'outline'}>
                                {data.privacySettings.showMeInDiscover ? 'Sí' : 'No'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Verificación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge className={data.verificationStatus === 'Verificado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}>
                            {data.verificationStatus}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <UserX className="h-4 w-4" /> Bloqueados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{data.blockedCount}</p>
                        <p className="text-xs text-muted-foreground">usuarios bloqueados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Reportes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{data.reportsMade}</p>
                        <p className="text-xs text-muted-foreground">reportes enviados</p>
                    </CardContent>
                </Card>
            </div>

            {data.recommendations.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-500" /> Recomendaciones
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {data.recommendations.map((r, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-orange-500">→</span> {r}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
