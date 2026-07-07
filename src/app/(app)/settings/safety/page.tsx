'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, ShieldCheck, ShieldAlert, AlertTriangle, Info, Phone, CheckCircle, Users, FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface BlockedUser {
    id: string;
    displayName: string;
    photos: string[];
}

interface Report {
    id: string;
    reason: string;
    status: string;
    createdAt: string;
}

export default function SafetyCenterPage() {
    const router = useRouter();
    const { profile } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/safety/status').then(r => r.json()).catch(() => ({})),
        ]).then(([status]) => {
            setBlockedUsers(status.blockedUsers || []);
            setReports(status.reports || []);
        }).finally(() => setLoading(false));
    }, []);

    const tips = [
        {
            icon: Shield,
            title: 'Primer encuentro seguro',
            description: 'Elige un lugar público y concurrido. Informa a una amiga o familiar de dónde vas y con quién.',
        },
        {
            icon: AlertTriangle,
            title: 'Detecta estafas',
            description: 'Nunca envíes dinero a alguien que no conoces. Las estafas románticas son comunes — desconfía de historias trágicas urgentes.',
        },
        {
            icon: Info,
            title: 'Reconoce el catfishing',
            description: 'Si las fotos parecen profesionales o la persona evita videollamadas, podría no ser quien dice ser. Pide verificación.',
        },
        {
            icon: ShieldCheck,
            title: 'Comparte ubicación',
            description: 'Comparte tu ubicación en tiempo real con una amiga durante la cita. Muchos teléfonos tienen esta función integrada.',
        },
    ];

    const emergencyContacts = [
        { name: 'Emergencias México', number: '911' },
        { name: 'Línea de la Vida', number: '800-911-2000' },
        { name: 'LOCATEL', number: '55-5658-1111' },
    ];

    return (
        <div className="h-dvh overflow-y-auto">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Centro de Seguridad</h1>
            </header>

            <main className="p-4 space-y-6 max-w-2xl mx-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Loader2 className="animate-spin h-8 w-8 mb-4" />
                        <p>Cargando...</p>
                    </div>
                ) : (<>
                {/* Trust Status */}
                {profile && (
                    <Card className={profile?.isVerified ? "border-primary/20 bg-primary/10" : "border-border"}>
                        <CardContent className="flex items-center gap-4 p-6">
                            <div className={profile?.isVerified ? "rounded-full bg-primary/20 p-3" : "rounded-full bg-muted p-3"}>
                                {profile?.isVerified
                                    ? <ShieldCheck className="h-6 w-6 text-primary" />
                                    : <ShieldAlert className="h-6 w-6 text-muted-foreground" />}
                            </div>
                            <div>
                                <p className="font-bold text-foreground">
                                    {profile?.isVerified ? "Tu cuenta está verificada" : "Verifica tu identidad"}
                                </p>
                                <p className={profile?.isVerified ? "text-sm text-primary" : "text-sm text-muted-foreground"}>
                                    {profile?.isVerified
                                        ? '✓ Identidad verificada — esto genera mayor confianza en otros usuarios'
                                        : 'Tu identidad no ha sido verificada aún. Verificalo para generar más confianza.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            Herramientas de seguridad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Link href="/settings/privacy/blocked">
                            <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Bloqueados ({blockedUsers.length})</p>
                                    <p className="text-xs text-muted-foreground">Gestiona tu lista de bloqueados</p>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/settings/verification">
                            <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                                <CheckCircle className="h-5 w-5 text-accent-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Verificar identidad</p>
                                    <p className="text-xs text-muted-foreground">Obtén tu badge de verificación</p>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/settings/privacy">
                            <Button variant="outline" className="w-full justify-start h-auto py-4 gap-3">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                <div className="text-left">
                                    <p className="font-medium">Configuración de privacidad</p>
                                    <p className="text-xs text-muted-foreground">Controla tu visibilidad</p>
                                </div>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Reports */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            Mis reportes
                        </CardTitle>
                        <CardDescription>Historial de reportes enviados</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {reports.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No has enviado ningún reporte. ¡Es bueno que no lo necesites!
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {reports.map(report => (
                                    <div key={report.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                        <div>
                                            <p className="text-sm font-medium">{report.reason}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(report.createdAt).toLocaleDateString('es-MX')}
                                            </p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                            report.status === 'reviewed' ? 'bg-primary/20 text-primary' :
                                            report.status === 'pending' ? 'bg-warning/20 text-foreground' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                            {report.status === 'reviewed' ? 'Revisado' :
                                             report.status === 'pending' ? 'Pendiente' : report.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Safety Tips */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Consejos de seguridad
                        </CardTitle>
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

                {/* Emergency Resources */}
                <Card className="border-destructive/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Phone className="h-5 w-5" />
                            Recursos de emergencia
                        </CardTitle>
                        <CardDescription>
                            Si estás en peligro inmediato, contacta a las autoridades
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {emergencyContacts.map((contact, i) => (
                            <a
                                key={i}
                                href={`tel:${contact.number}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 hover:bg-destructive/20 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-sm">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground">{contact.number}</p>
                                </div>
                                <Phone className="h-4 w-4 text-destructive" />
                            </a>
                        ))}
                        <p className="text-xs text-center text-muted-foreground pt-2">
                            Alora no es un servicio de emergencia. Para emergencias, contacta siempre a las autoridades locales.
                        </p>
                    </CardContent>
                </Card>
                </>
                )}
            </main>
        </div>
    );
}
