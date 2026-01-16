'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, UserX, AlertTriangle, CheckCircle, Loader2, Ban, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
    const { user, profile } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [reports, setReports] = useState<any[]>([]);
    const [riskProfiles, setRiskProfiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (profile && !['admin@alora.app', 'alejandroperezitsur@gmail.com'].includes(profile.email)) {
            router.push('/');
        } else {
            fetchData();
        }
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reportsRes, riskRes] = await Promise.all([
                fetch('/api/admin?type=reports').then(res => res.json()),
                fetch('/api/admin?type=risk').then(res => res.json())
            ]);
            setReports(reportsRes.reports || []);
            setRiskProfiles(riskRes.profiles || []);
        } catch (error) {
            toast({ title: "Error", description: "No se pudieron cargar los datos.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (targetUserId: string, type: string, reportId?: string) => {
        const reason = window.prompt("Motivo de la acción:");
        if (!reason) return;

        setActionLoading(targetUserId);
        try {
            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId, type, reason, reportId })
            });

            if (!res.ok) throw new Error("Acción fallida");

            toast({ title: "Acción completada", description: `Usuario ${type} exitosamente.` });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "No se pudo completar la acción.", variant: "destructive" });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <ShieldAlert className="text-pink-600" /> Admin Safety Panel
                    </h1>
                    <p className="text-muted-foreground">Gestión de confianza, seguridad y moderación en Alora.</p>
                </div>
                <Button variant="outline" onClick={() => router.push('/')}>Cerrar Panel</Button>
            </header>

            <Tabs defaultValue="reports" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        Reportes Pendientes <Badge variant="secondary">{reports.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="risk" className="flex items-center gap-2">
                        Perfiles de Riesgo <Badge variant="secondary">{riskProfiles.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="reports">
                    <div className="grid gap-4">
                        {reports.length === 0 && <p className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">No hay reportes pendientes. ¡Buen trabajo!</p>}
                        {reports.map(report => (
                            <Card key={report.id} className="overflow-hidden border-destructive/20 shadow-sm">
                                <CardHeader className="bg-destructive/5 py-4">
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-destructive" />
                                            {report.category.toUpperCase()}
                                        </CardTitle>
                                        <Badge>{new Date(report.createdAt._seconds * 1000).toLocaleDateString()}</Badge>
                                    </div>
                                    <CardDescription>
                                        Reportado por #{report.reporterId.slice(0, 8)} contra #{report.reportedId.slice(0, 8)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4">
                                    <p className="text-sm border-l-4 border-muted pl-4 italic mb-6">"{report.description || 'Sin descripción adicional'}"</p>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleAction(report.reportedId, 'warn', report.id)}>Advertir</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleAction(report.reportedId, 'restrict', report.id)}>Restringir</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleAction(report.reportedId, 'ban', report.id)}>Bannear</Button>
                                        <Button size="sm" variant="ghost" onClick={() => handleAction(report.reportedId, 'pardon', report.id)}>Descartar</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="risk">
                    <div className="grid gap-4">
                        {riskProfiles.map(profile => (
                            <Card key={profile.id} className="flex flex-col md:flex-row items-center p-4 gap-6">
                                <div className="h-16 w-16 rounded-full bg-muted overflow-hidden flex-shrink-0">
                                    {profile.photos?.[0] ? <img src={profile.photos[0]} className="object-cover h-full w-full" /> : <div className="flex items-center justify-center h-full"><ShieldCheck /></div>}
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <div className="flex items-center gap-2 justify-center md:justify-start">
                                        <h3 className="font-bold text-lg">{profile.displayName || 'Anonimo'}</h3>
                                        <Badge variant={profile.trustStatus === 'restricted' ? 'destructive' : 'warning'}>{profile.trustStatus}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">{profile.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleAction(profile.id, profile.trustStatus === 'restricted' ? 'ban' : 'pardon')}>
                                        {profile.trustStatus === 'restricted' ? <Ban className="h-4 w-4 mr-1" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
                                        {profile.trustStatus === 'restricted' ? 'Ban' : 'Pardon'}
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
