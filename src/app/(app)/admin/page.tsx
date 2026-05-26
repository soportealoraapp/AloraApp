'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Flag, ShieldCheck, BarChart3, MessageSquare, Heart, Activity, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Metrics {
    overview: { totalUsers: number; totalProfiles: number; totalMatches: number; totalMessages: number; totalReports: number; pendingReports: number; pendingVerifications: number };
    activity: { dau: number; wau: number; mau: number; stickiness: string };
    daily: { newUsers: number; newMatches: number; messagesSent: number; reportsFiled: number; matchRate: string };
}

export default function AdminPage() {
    const router = useRouter();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/metrics')
            .then(r => r.json())
            .then(data => { setMetrics(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const cards = [
        { title: 'Usuarios', value: metrics?.overview.totalUsers, icon: Users, href: '/admin/users', color: 'blue' },
        { title: 'Matches', value: metrics?.overview.totalMatches, icon: Heart, href: '/admin/users', color: 'pink' },
        { title: 'Mensajes', value: metrics?.overview.totalMessages, icon: MessageSquare, href: '/admin/users', color: 'purple' },
        { title: 'DAU', value: metrics?.activity.dau, icon: Activity, href: '/admin/metrics', color: 'green' },
        { title: 'Reportes Pendientes', value: metrics?.overview.pendingReports, icon: Flag, href: '/admin/reports', color: metrics?.overview.pendingReports && metrics.overview.pendingReports > 0 ? 'red' : 'gray' },
        { title: 'Verif. Pendientes', value: metrics?.overview.pendingVerifications, icon: ShieldCheck, href: '/admin/verifications', color: metrics?.overview.pendingVerifications && metrics.overview.pendingVerifications > 0 ? 'amber' : 'gray' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100">
            <header className="sticky top-0 z-30 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm px-6 py-4">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">Sprint 3</span>
                </div>
            </header>

            <div className="flex">
                <nav className="w-56 min-h-screen border-r border-gray-800 p-4 space-y-1 hidden md:block">
                    {[
                        { href: '/admin', label: 'Dashboard', icon: BarChart3 },
                        { href: '/admin/reports', label: 'Reportes', icon: Flag },
                        { href: '/admin/verifications', label: 'Verificaciones', icon: ShieldCheck },
                        { href: '/admin/users', label: 'Usuarios', icon: Users },
                        { href: '/admin/metrics', label: 'Métricas', icon: Activity },
                    ].map(item => (
                        <Link key={item.href} href={item.href}>
                            <div className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${item.href === '/admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </div>
                        </Link>
                    ))}
                </nav>

                <main className="flex-1 p-6">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl bg-gray-800" />)}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                {cards.map(card => (
                                    <Link key={card.title} href={card.href}>
                                        <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wider">{card.title}</p>
                                                        <p className="text-2xl font-bold mt-1">{card.value ?? '—'}</p>
                                                    </div>
                                                    <div className={`p-3 rounded-full bg-${card.color}-500/10`}>
                                                        <card.icon className={`h-5 w-5 text-${card.color}-400`} />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card className="bg-gray-900 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-gray-300">Actividad Diaria</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            { label: 'Nuevos usuarios', value: metrics?.daily.newUsers },
                                            { label: 'Nuevos matches', value: metrics?.daily.newMatches },
                                            { label: 'Mensajes enviados', value: metrics?.daily.messagesSent },
                                            { label: 'Reportes', value: metrics?.daily.reportsFiled },
                                            { label: 'Match rate', value: metrics?.daily.matchRate },
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between text-sm">
                                                <span className="text-gray-400">{item.label}</span>
                                                <span className="font-medium">{item.value ?? '—'}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card className="bg-gray-900 border-gray-800">
                                    <CardHeader>
                                        <CardTitle className="text-sm text-gray-300">Retención</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {[
                                            { label: 'DAU', value: metrics?.activity.dau },
                                            { label: 'WAU', value: metrics?.activity.wau },
                                            { label: 'MAU', value: metrics?.activity.mau },
                                            { label: 'Stickiness', value: `${metrics?.activity.stickiness}%` },
                                        ].map(item => (
                                            <div key={item.label} className="flex justify-between text-sm">
                                                <span className="text-gray-400">{item.label}</span>
                                                <span className="font-medium">{item.value ?? '—'}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Quick Actions */}
                            {metrics && (metrics.overview.pendingReports > 0 || metrics.overview.pendingVerifications > 0) && (
                                <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <div className="flex items-center gap-2 text-amber-400 mb-3">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span className="font-semibold text-sm">Acciones pendientes</span>
                                    </div>
                                    <div className="flex gap-3">
                                        {metrics.overview.pendingReports > 0 && (
                                            <Link href="/admin/reports">
                                                <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-300">
                                                    <Flag className="h-3 w-3 mr-1" /> {metrics.overview.pendingReports} reportes
                                                </Button>
                                            </Link>
                                        )}
                                        {metrics.overview.pendingVerifications > 0 && (
                                            <Link href="/admin/verifications">
                                                <Button variant="outline" size="sm" className="border-amber-500/30 text-amber-300">
                                                    <ShieldCheck className="h-3 w-3 mr-1" /> {metrics.overview.pendingVerifications} verificaciones
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
