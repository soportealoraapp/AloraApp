'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, ShieldCheck, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { AdminBackButton } from '@/components/admin/AdminBackButton';
import { SafeImage } from '@/components/ui/safe-image';
import { useToast } from '@/hooks/use-toast';

interface Submission {
    id: string; selfieUrl: string; status: string; reason: string | null; createdAt: string;
    user: { id: string; email: string; name: string | null; profile: { displayName: string | null; age: number | null; gender: string | null; photos: string[]; trustStatus: string; isVerified: boolean } | null };
}

export default function AdminVerificationsPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [confirmApproveId, setConfirmApproveId] = useState<string | null>(null);
    const [confirmRejectId, setConfirmRejectId] = useState<string | null>(null);
    const { toast } = useToast();

    const loadSubmissions = async (status: string) => {
        setLoading(true);
        try {
            const r = await fetch(`/api/admin/verifications?status=${status}`);
            const data = await r.json();
            setSubmissions(data.submissions || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadSubmissions(filter); }, [filter]);

    const handleAction = async (submissionId: string, action: string, reason?: string) => {
        try {
            const r = await fetch('/api/admin/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, action, ...(reason ? { reason } : {}) }),
            });
            const data = await r.json().catch(() => ({}));
            if (!r.ok) {
                toast({ title: 'Error', description: data?.error || 'No se pudo completar la acción', variant: 'destructive' });
                return;
            }
            loadSubmissions(filter);
            const actionLabels: Record<string, string> = {
                approve: 'Verificación aprobada',
                reject: 'Verificación rechazada',
            };
            toast({ title: 'Éxito', description: actionLabels[action] || 'Acción completada' });
        } catch (e) { console.error(e); toast({ title: 'Error', description: 'Error de conexión', variant: 'destructive' }); }
    };

    const handleRejectClick = (submissionId: string) => {
        setConfirmRejectId(submissionId);
    };

    const confirmReject = () => {
        if (!confirmRejectId) return;
        const reason = window.prompt('Razón del rechazo (opcional):');
        handleAction(confirmRejectId, 'reject', reason || undefined);
        setConfirmRejectId(null);
    };

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="border-b border-border bg-background/80 px-6 py-4 flex items-center gap-4">
                <AdminBackButton />
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <h1 className="text-xl font-bold">Verificaciones</h1>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => loadSubmissions(filter)} disabled={loading} aria-label="Actualizar">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <div className="flex gap-2 ml-auto">
                    {[
                        { key: 'pending', label: 'Pendientes' },
                        { key: 'approved', label: 'Aprobadas' },
                        { key: 'rejected', label: 'Rechazadas' },
                    ].map(({ key, label }) => (
                        <Button key={key} variant={filter === key ? 'default' : 'outline'} size="sm" onClick={() => setFilter(key)}
                            className={filter === key ? '' : 'border-border text-muted-foreground'}
                            aria-pressed={filter === key}>
                            {label}
                        </Button>
                    ))}
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-4">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl bg-muted" />)
                ) : submissions.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                        <p>No hay verificaciones {filter === 'pending' ? 'pendientes' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}</p>
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Reintentar
                        </Button>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-start gap-6">
                                <div className="relative h-40 w-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                    <SafeImage src={sub.selfieUrl} alt="Selfie de verificación" fill className="object-cover" loading="lazy" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                            {sub.user.profile?.photos?.[0] ? (
                                                <SafeImage src={sub.user.profile.photos[0]} alt="Foto de perfil" fill className="object-cover" loading="lazy" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{sub.user.profile?.displayName || 'Desconocido'}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {sub.user.email} · {sub.user.profile?.age} años · {sub.user.profile?.gender}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                        <Badge variant="outline" className={`text-xs ${sub.user.profile?.isVerified ? 'border-emerald-500/30 text-emerald-400' : 'border-border text-muted-foreground'}`}>
                                            {sub.user.profile?.isVerified ? 'Verificado' : 'No verificado'}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-border">{sub.user.profile?.trustStatus}</Badge>
                                        <span className="text-xs">Enviado: {new Date(sub.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {sub.user.profile && sub.user.profile.photos.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {sub.user.profile.photos.slice(0, 4).map((photo, i) => (
                                                <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted">
                                                    <SafeImage src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" loading="lazy" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {filter === 'pending' && (
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <AlertDialog open={confirmApproveId === sub.id} onOpenChange={(open) => !open && setConfirmApproveId(null)}>
                                        <Button onClick={() => setConfirmApproveId(sub.id)}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                                            <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                                        </Button>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Aprobar esta verificación?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Se verificará la identidad de {sub.user.profile?.displayName || 'este usuario'} y se actualizará su perfil.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleAction(sub.id, 'approve')}>
                                                    Aprobar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <AlertDialog open={confirmRejectId === sub.id} onOpenChange={(open) => !open && setConfirmRejectId(null)}>
                                        <Button onClick={() => handleRejectClick(sub.id)}
                                            variant="outline" className="border-red-500/30 text-red-400 hover:text-red-300 text-xs">
                                            <XCircle className="h-3 w-3 mr-1" /> Rechazar
                                        </Button>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>¿Rechazar esta verificación?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Se rechazará la verificación de {sub.user.profile?.displayName || 'este usuario'}.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={confirmReject} className="bg-red-600 hover:bg-red-500 text-white">
                                                    Rechazar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>

                                    <a href={sub.selfieUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                                            <ExternalLink className="h-3 w-3 mr-1" /> Ver original
                                        </Button>
                                    </a>
                                </div>
                            )}

                            {sub.reason && (
                                <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                    Razón: {sub.reason}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
