'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldAlert, Lock, Eye, UserX, FileText, AlertTriangle, Loader2, ArrowLeft, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface SafetyData {
    overallProtection: 'high' | 'medium' | 'low';
    verificationStatus: string;
    blockedCount: number;
    reportsMade: number;
    privacySettings: { incognito: boolean; showMeInDiscover: boolean; verifiedOnlyFilter: boolean };
    recommendations: string[];
}

export default function SafetyCenterPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { refreshProfile } = useAuth();
    const [data, setData] = useState<SafetyData | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/safety/status');
            const result = await res.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching safety status:', error);
        }
    };

    const togglePrivacy = async (field: 'incognito' | 'showMeInDiscover', value: boolean) => {
        if (!data) return;
        setUpdating(field);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) throw new Error('Error updating');

            setData({
                ...data,
                privacySettings: { ...data.privacySettings, [field]: value }
            });

            await refreshProfile();

            toast({ title: 'Actualizado', description: `${field === 'incognito' ? 'Modo incognito' : 'Visibilidad'} actualizado` });
        } catch (error: any) {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
            setUpdating(null);
        }
    };

    if (!data) {
        return (
            <div className="md:pl-60 p-6 flex justify-center py-20">
                <Loader2 className="animate-spin text-pink-500 h-8 w-8" />
            </div>
        );
    }

    const protectionConfig = {
        high: { icon: ShieldCheck, label: 'Tu perfil esta protegido', color: 'text-green-600', bg: 'bg-green-50' },
        medium: { icon: Shield, label: 'Proteccion parcial', color: 'text-yellow-600', bg: 'bg-yellow-50' },
        low: { icon: ShieldAlert, label: 'Recomendamos activar estas medidas', color: 'text-orange-600', bg: 'bg-orange-50' },
    };

    const config = protectionConfig[data.overallProtection];
    const Icon = config.icon;

    return (
        <div className="md:pl-60 p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Centro de Seguridad</h1>
                    <p className="text-sm text-muted-foreground">Tu seguridad es nuestra prioridad</p>
                </div>
            </div>

            <Card className={`${config.bg} border-none`}>
                <CardContent className="p-6 flex items-center gap-4">
                    <Icon className={`h-12 w-12 ${config.color}`} />
                    <div>
                        <h2 className={`text-lg font-bold ${config.color}`}>{config.label}</h2>
                        <p className="text-sm text-muted-foreground">
                            Nivel de proteccion: {data.overallProtection === 'high' ? 'Alto' : data.overallProtection === 'medium' ? 'Medio' : 'Bajo'}
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
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Modo incognito</p>
                                <p className="text-xs text-muted-foreground">Oculta tu perfil del descubrimiento</p>
                            </div>
                            <Switch
                                checked={data.privacySettings.incognito}
                                onCheckedChange={(v) => togglePrivacy('incognito', v)}
                                disabled={updating === 'incognito'}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Visible en descubrir</p>
                                <p className="text-xs text-muted-foreground">Aparecer en el feed de descubrimiento</p>
                            </div>
                            <Switch
                                checked={data.privacySettings.showMeInDiscover}
                                onCheckedChange={(v) => togglePrivacy('showMeInDiscover', v)}
                                disabled={updating === 'showMeInDiscover'}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Verificacion
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Badge className={data.verificationStatus === 'Verificado' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}>
                            {data.verificationStatus}
                        </Badge>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={() => router.push('/settings/verification')}
                        >
                            {data.verificationStatus === 'Verificado' ? 'Ver detalles' : 'Verificar identidad'}
                        </Button>
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
                        <p className="text-xs text-muted-foreground mb-3">usuarios bloqueados</p>
                        <Button variant="outline" size="sm" onClick={() => router.push('/settings/privacy/blocked')}>
                            Ver lista
                        </Button>
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

            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push('/settings/safety/experience')}>
                <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl">
                        <BarChart3 className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-medium text-sm">Tu experiencia en Alora</p>
                        <p className="text-xs text-muted-foreground">Metricas de calidad, respeto y conversaciones</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
