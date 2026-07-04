'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Flag, RefreshCw, ShieldAlert, Ban, EyeOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface Report {
    id: string; reason: string; status: string; createdAt: string; reportCount: number; details?: string;
    reporter: { id: string; email: string; name: string | null };
    reported: { id: string; email: string; name: string | null; profile: { displayName: string | null; photos: string[]; trustStatus: string; isVerified: boolean; reputationScore: number } | null };
}

const ACTION_LABELS: Record<string, string> = {
    ignore: 'Ignorar',
    warn: 'Advertir',
    shadowban: 'Aplicar Shadowban',
    suspend: 'Suspender',
    ban: 'Banear',
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
    ignore: 'El reporte será marcado como ignorado sin afectar al usuario.',
    warn: 'Se enviará una advertencia al usuario reportado.',
    shadowban: 'El contenido del usuario será oculto de otros usuarios.',
    suspend: 'El usuario será suspendido y su reputación se reducirá en 50 puntos.',
    ban: 'El usuario será expulsado permanentemente. Esta acción desactivará todos sus matches.',
};

export default function AdminReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [actionConfirm, setActionConfirm] = useState<{ reportId: string; action: string; userName: string } | null>(null);

    const fetchReports = async (status: string) => {
        setLoading(true);
        try {
            const r = await fetch(`/api/admin/reports?status=${status}`);
            const data = await r.json();
            setReports(data.reports || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(filter); }, [filter]);

    const handleAction = async (reportId: string, action: string) => {
        try {
            await fetch('/api/admin/reports', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, action }),
            });
            fetchReports(filter);
        } catch (e) { console.error(e); }
    };

    const executeAction = (reportId: string, action: string) => {
        const report = reports.find(r => r.id === reportId);
        const userName = report?.reported?.profile?.displayName || report?.reported?.email || 'Desconocido';
        if (action === 'ignore') {
            handleAction(reportId, action);
        } else {
            setActionConfirm({ reportId, action, userName });
        }
    };

    const statusColor = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'reviewed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'dismissed': return 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20';
            case 'resolved': return 'bg-green-500/10 text-green-500 dark:text-green-400 border-green-500/20';
            default: return 'bg-muted-foreground/10 text-muted-foreground';
        }
    };

    const trustColor = (s: string) => {
        switch (s) {
            case 'clean': return 'text-green-500 dark:text-green-400';
            case 'watchlist': return 'text-amber-500 dark:text-amber-400';
            case 'banned': return 'text-red-500 dark:text-red-400';
            default: return 'text-muted-foreground';
        }
    };

    const actionButtonStyle = (action: string) => {
        switch (action) {
            case 'ignore': return 'border-border text-muted-foreground hover:text-foreground';
            case 'warn': return 'border-amber-500/30 text-amber-400 hover:text-amber-300';
            case 'shadowban': return 'border-border text-muted-foreground hover:text-foreground';
            case 'suspend': return 'border-orange-500/30 text-orange-400 hover:text-orange-300';
            case 'ban': return 'border-red-500/30 text-red-400 hover:text-red-300';
            default: return '';
        }
    };

    const actionIcon = (action: string) => {
        switch (action) {
            case 'ignore': return <XCircle className="h-3 w-3 mr-1" />;
            case 'warn': return <AlertTriangle className="h-3 w-3 mr-1" />;
            case 'shadowban': return <EyeOff className="h-3 w-3 mr-1" />;
            case 'suspend': return <ShieldAlert className="h-3 w-3 mr-1" />;
            case 'ban': return <Ban className="h-3 w-3 mr-1" />;
            default: return null;
        }
    };

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 text-red-400" />
                    <h1 className="text-xl font-bold">Reportes</h1>
                </div>
                <div className="flex gap-2 ml-auto">
                    {[
                        { key: 'pending', label: 'Pendientes' },
                        { key: 'reviewed', label: 'Revisados' },
                        { key: 'dismissed', label: 'Descartados' },
                        { key: 'resolved', label: 'Resueltos' },
                    ].map(({ key, label }) => (
                        <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)}
                            className={filter === key ? '' : 'border-border text-muted-foreground'}>
                            {label}
                        </Button>
                    ))}
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-3">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-muted" />)
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                        <p>No hay reportes {filter === 'pending' ? 'pendientes' : 'en este estado'}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                        </Button>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                        {report.reported?.profile?.photos?.[0] ? (
                                            <SafeImage src={report.reported.profile.photos[0]} alt="Foto de perfil" fill className="object-cover" loading="lazy" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                                                {report.reported?.profile?.displayName?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{report.reported?.profile?.displayName || 'Desconocido'}</span>
                                            <Badge variant="outline" className={trustColor(report.reported?.profile?.trustStatus || '')}>
                                                {report.reported?.profile?.trustStatus}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Score: {report.reported?.profile?.reputationScore}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                            <Badge variant="outline" className="text-xs border-border">{report.reason}</Badge>
                                            <span>Reportes: {report.reportCount}</span>
                                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {report.details && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{report.details}</p>
                                        )}
                                        <div className="text-xs text-muted-foreground/60 mt-1">
                                            Reportado por: {report.reporter?.email || 'Desconocido'}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={statusColor(report.status)}>
                                    {report.status}
                                </Badge>
                            </div>

                            {filter === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t border-border">
                                    {(['ignore', 'warn', 'shadowban', 'suspend', 'ban'] as const).map(action => (
                                        <Button
                                            key={action}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => executeAction(report.id, action)}
                                            className={`${actionButtonStyle(action)} text-xs`}
                                        >
                                            {actionIcon(action)} {ACTION_LABELS[action]}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>

            <AlertDialog open={!!actionConfirm} onOpenChange={(open) => { if (!open) setActionConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Confirmar acción: {actionConfirm ? ACTION_LABELS[actionConfirm.action] : ''}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            <p className="mb-2">
                                {actionConfirm ? ACTION_DESCRIPTIONS[actionConfirm.action] : ''}
                            </p>
                            <p className="font-medium">
                                Usuario: {actionConfirm?.userName}
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setActionConfirm(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            className={actionConfirm?.action === 'ban' ? 'bg-destructive hover:bg-destructive/90' : ''}
                            onClick={() => {
                                if (actionConfirm) {
                                    handleAction(actionConfirm.reportId, actionConfirm.action);
                                    setActionConfirm(null);
                                }
                            }}
                        >
                            Confirmar {actionConfirm ? ACTION_LABELS[actionConfirm.action] : ''}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
