'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Search, Ban, ShieldAlert, EyeOff, CheckCircle, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AdminUser {
    id: string; email: string; name: string | null; role: string; isActive: boolean; createdAt: string;
    profile: { displayName: string | null; age: number | null; photos: string[]; trustStatus: string; isVerified: boolean; isShadowBanned: boolean; reputationScore: number; subscriptionStatus: string } | null;
    _count: { reportsSent: number; reportsReceived: number; sentMessages: number; matchesAsUser1: number; matchesAsUser2: number };
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [trustFilter, setTrustFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [roleConfirmUser, setRoleConfirmUser] = useState<AdminUser | null>(null);
    const [destructiveConfirm, setDestructiveConfirm] = useState<{ user: AdminUser; action: string } | null>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const [searchInput, setSearchInput] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (trustFilter !== 'all') params.set('trustStatus', trustFilter);
            params.set('page', String(page));
            params.set('limit', '20');
            const r = await fetch(`/api/admin/users?${params}`);
            const data = await r.json();
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [search, trustFilter, page]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // Debounced search
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [searchInput]);

    const handleAction = async (userId: string, action: string, value?: string) => {
        try {
            await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action, value }),
            });
            fetchUsers();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <h1 className="text-xl font-bold">Usuarios</h1>
                </div>
                <div className="flex gap-2 ml-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 h-9 w-48 bg-muted border-border text-sm text-foreground"
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                        />
                    </div>
                    <select value={trustFilter} onChange={e => { setTrustFilter(e.target.value); setPage(1); }}
                        className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground">
                        <option value="all">Todos</option>
                        <option value="clean">Limpio</option>
                        <option value="watchlist">Observación</option>
                        <option value="banned">Baneado</option>
                    </select>
                </div>
            </header>

            <main className="p-6 max-w-6xl mx-auto space-y-2">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-muted" />)
                ) : users.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/60" />
                        <p>No se encontraron usuarios</p>
                    </div>
                ) : (
                    <>
                        {users.map(u => (
                            <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                                <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                                        {u.profile?.photos?.[0] ? (
                                        <SafeImage src={u.profile.photos[0]} alt="Foto de perfil" fill className="object-cover" loading="lazy" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">?</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold truncate">{u.profile?.displayName || u.email}</span>
                                        {u.role !== 'user' && (
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs">
                                                {u.role}
                                            </Badge>
                                        )}
                                        {u.profile?.isVerified && (
                                            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                        )}
                                        <Badge variant="outline" className={`text-xs ${u.profile?.trustStatus === 'clean' ? 'border-green-500/30 text-green-400' : u.profile?.trustStatus === 'watchlist' ? 'border-amber-500/30 text-amber-400' : 'border-red-500/30 text-red-400'}`}>
                                            {u.profile?.trustStatus}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                        <span>{u.email}</span>
                                        <span>Punt.: {u.profile?.reputationScore}</span>
                                        <span>Conexiones: {(u._count.matchesAsUser1 + u._count.matchesAsUser2)}</span>
                                        <span>Reportes: {u._count.reportsReceived}</span>
                                        <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 flex-shrink-0">
                                    <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs"
                                        onClick={() => setDestructiveConfirm({ user: u, action: 'shadowban' })} title="Sombreado">
                                        <EyeOff className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs"
                                        onClick={() => setDestructiveConfirm({ user: u, action: 'suspend' })} title="Suspender">
                                        <ShieldAlert className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground h-8 text-xs"
                                        onClick={() => setRoleConfirmUser(u)} title="Cambiar rol">
                                        <Shield className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 h-8 text-xs"
                                        onClick={() => setDestructiveConfirm({ user: u, action: 'ban' })} title="Expulsar">
                                        <Ban className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 pt-4">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground px-3">
                                    Página {page} de {totalPages}
                                </span>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <AlertDialog open={!!roleConfirmUser} onOpenChange={(open) => { if (!open) setRoleConfirmUser(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {roleConfirmUser?.role === 'admin' ? 'Revocar rol de Admin' : 'Promover a Admin'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {roleConfirmUser?.role === 'admin'
                                ? `¿Seguro que deseas revocar el rol de admin de ${roleConfirmUser?.profile?.displayName || roleConfirmUser?.email}?`
                                : `¿Seguro que deseas promover a ${roleConfirmUser?.profile?.displayName || roleConfirmUser?.email} a admin? Esta acción otorga acceso total al panel de administración.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRoleConfirmUser(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (roleConfirmUser) {
                                handleAction(roleConfirmUser.id, 'set_role', roleConfirmUser.role === 'admin' ? 'user' : 'admin');
                                setRoleConfirmUser(null);
                            }
                        }}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!destructiveConfirm} onOpenChange={(open) => { if (!open) setDestructiveConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {destructiveConfirm?.action === 'ban' ? 'Expulsar usuario' :
                             destructiveConfirm?.action === 'suspend' ? 'Suspender usuario' :
                             'Sombreado de usuario'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {destructiveConfirm?.action === 'ban'
                                ? `¿Estás seguro de que deseas expulsar a ${destructiveConfirm?.user?.profile?.displayName || destructiveConfirm?.user?.email}? Esta acción desactivará todos sus matches y es irreversible desde la UI.`
                                : destructiveConfirm?.action === 'suspend'
                                ? `¿Estás seguro de que deseas suspender a ${destructiveConfirm?.user?.profile?.displayName || destructiveConfirm?.user?.email}? Su reputación se reducirá en 50 puntos.`
                                : `¿Estás seguro de que deseas aplicar sombreado a ${destructiveConfirm?.user?.profile?.displayName || destructiveConfirm?.user?.email}? Su contenido será oculto de otros usuarios.`
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDestructiveConfirm(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            if (destructiveConfirm) {
                                handleAction(destructiveConfirm.user.id, destructiveConfirm.action);
                                setDestructiveConfirm(null);
                            }
                        }}>
                            Confirmar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
