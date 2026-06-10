'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Users, Search, Ban, ShieldAlert, EyeOff, CheckCircle, Shield, Flag } from 'lucide-react';
import Image from 'next/image';

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

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (trustFilter !== 'all') params.set('trustStatus', trustFilter);
            const r = await fetch(`/api/admin/users?${params}`);
            const data = await r.json();
            setUsers(data.users || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, [search, trustFilter]);

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
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="text-gray-400">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-400" />
                    <h1 className="text-xl font-bold">Usuarios</h1>
                </div>
                <div className="flex gap-2 ml-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9 h-9 w-48 bg-gray-800 border-gray-700 text-sm text-gray-200"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select value={trustFilter} onChange={e => setTrustFilter(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300">
                        <option value="all">Todos</option>
                        <option value="clean">Clean</option>
                        <option value="watchlist">Watchlist</option>
                        <option value="banned">Banned</option>
                    </select>
                </div>
            </header>

            <main className="p-6 max-w-6xl mx-auto space-y-2">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-gray-800" />)
                ) : (
                    users.map(u => (
                        <div key={u.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                {u.profile?.photos?.[0] ? (
                                    <Image src={u.profile.photos[0]} alt="" fill className="object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-gray-600">?</div>
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
                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                    <span>{u.email}</span>
                                    <span>Score: {u.profile?.reputationScore}</span>
                                    <span>Matches: {(u._count.matchesAsUser1 + u._count.matchesAsUser2)}</span>
                                    <span>Reports: {u._count.reportsReceived}</span>
                                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex gap-1.5 flex-shrink-0">
                                <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs"
                                    onClick={() => handleAction(u.id, 'shadowban')} title="Shadowban">
                                    <EyeOff className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs"
                                    onClick={() => handleAction(u.id, 'suspend')} title="Suspend">
                                    <ShieldAlert className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-500 h-8 text-xs"
                                    onClick={() => handleAction(u.id, 'ban')} title="Ban">
                                    <Ban className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-500 h-8 text-xs"
                                    onClick={() => handleAction(u.id, 'set_role', u.role === 'admin' ? 'user' : 'admin')} title="Toggle admin">
                                    <Shield className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
