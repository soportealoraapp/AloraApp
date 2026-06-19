'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart3, TrendingUp, Users, MessageSquare, Heart, Flag, Activity, Zap, Download } from 'lucide-react';

interface Metrics {
    overview: { totalUsers: number; totalProfiles: number; totalMatches: number; totalMessages: number; totalReports: number; pendingReports: number; pendingVerifications: number };
    activity: { dau: number; wau: number; mau: number; stickiness: string };
    daily: { newUsers: number; newMatches: number; messagesSent: number; reportsFiled: number; matchRate: string };
}

interface FunnelStep {
    label: string; event: string; count: number; conversionRate: number | null;
}

interface RetentionRow {
    date: string; newUsers: number; d1: number; d1Percent: number; d7: number; d7Percent: number; d30: number; d30Percent: number;
}

export default function AdminMetricsPage() {
    const router = useRouter();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [funnel, setFunnel] = useState<FunnelStep[]>([]);
    const [retention, setRetention] = useState<RetentionRow[]>([]);

    useEffect(() => {
        Promise.all([
            fetch('/api/admin/metrics').then(r => r.json()),
            fetch('/api/admin/analytics?type=funnel&days=30').then(r => r.json()),
            fetch('/api/admin/analytics?type=retention&days=30').then(r => r.json()),
        ])
            .then(([metricsData, funnelData, retentionData]) => {
                setMetrics(metricsData);
                setFunnel(funnelData.funnel || []);
                setRetention(retentionData.retention || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const exportCSV = () => {
        if (!metrics) return;
        const rows = [
            ['Metric', 'Value'],
            ['Total Users', metrics.overview.totalUsers],
            ['Total Profiles', metrics.overview.totalProfiles],
            ['Total Matches', metrics.overview.totalMatches],
            ['Total Messages', metrics.overview.totalMessages],
            ['Total Reports', metrics.overview.totalReports],
            ['Pending Reports', metrics.overview.pendingReports],
            ['Pending Verifications', metrics.overview.pendingVerifications],
            ['DAU', metrics.activity.dau],
            ['WAU', metrics.activity.wau],
            ['MAU', metrics.activity.mau],
            ['Stickiness %', metrics.activity.stickiness],
            ['New Users Today', metrics.daily.newUsers],
            ['New Matches Today', metrics.daily.newMatches],
            ['Messages Today', metrics.daily.messagesSent],
            ['Reports Today', metrics.daily.reportsFiled],
            ['Match Rate', metrics.daily.matchRate],
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alora-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportAnalyticsCSV = async (type: string) => {
        window.open(`/api/admin/analytics?type=${type}&days=30&format=csv`, '_blank');
    };

    const latestRetention = retention.length > 0 ? retention[retention.length - 1] : null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-400" />
                    <h1 className="text-xl font-bold">Métricas</h1>
                </div>
                <Button variant="outline" size="sm" onClick={exportCSV}
                    className="ml-auto border-border text-muted-foreground text-xs">
                    Exportar CSV
                </Button>
            </header>

            <main className="p-6 max-w-6xl mx-auto space-y-6">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-xl bg-muted" />)}
                    </div>
                ) : (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Overview</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'Usuarios', value: metrics?.overview.totalUsers, icon: Users },
                                        { label: 'Perfiles', value: metrics?.overview.totalProfiles, icon: Users },
                                        { label: 'Matches', value: metrics?.overview.totalMatches, icon: Heart },
                                        { label: 'Mensajes', value: metrics?.overview.totalMessages, icon: MessageSquare },
                                        { label: 'Reportes', value: metrics?.overview.totalReports, icon: Flag },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-muted-foreground"><item.icon className="h-3 w-3" />{item.label}</span>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Activity</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'DAU', value: metrics?.activity.dau, icon: Activity },
                                        { label: 'WAU', value: metrics?.activity.wau, icon: Activity },
                                        { label: 'MAU', value: metrics?.activity.mau, icon: Activity },
                                        { label: 'Stickiness', value: `${metrics?.activity.stickiness}%`, icon: TrendingUp },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-muted-foreground"><item.icon className="h-3 w-3" />{item.label}</span>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="bg-card border-border">
                                <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase">Daily</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'New Users', value: metrics?.daily.newUsers },
                                        { label: 'New Matches', value: metrics?.daily.newMatches },
                                        { label: 'Messages Sent', value: metrics?.daily.messagesSent },
                                        { label: 'Reports', value: metrics?.daily.reportsFiled },
                                        { label: 'Match Rate', value: metrics?.daily.matchRate },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">{item.label}</span>
                                            <span className="font-medium">{item.value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Queue Status */}
                        <Card className="bg-card border-border">
                            <CardHeader><CardTitle className="text-sm text-foreground">Queue Status</CardTitle></CardHeader>
                            <CardContent className="flex gap-4">
                                <div className="flex-1 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                                    <p className="text-2xl font-bold text-amber-400">{metrics?.overview.pendingReports}</p>
                                    <p className="text-xs text-muted-foreground">Reportes pendientes</p>
                                </div>
                                <div className="flex-1 p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                                    <p className="text-2xl font-bold text-emerald-400">{metrics?.overview.pendingVerifications}</p>
                                    <p className="text-xs text-muted-foreground">Verificaciones pendientes</p>
                                </div>
                                <div className="flex-1 p-4 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                                    <p className="text-2xl font-bold text-blue-400">{metrics?.activity.dau}</p>
                                    <p className="text-xs text-muted-foreground">Usuarios activos hoy</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Funnel */}
                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-400" /> Funnel de conversión
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => exportAnalyticsCSV('funnel')} className="text-muted-foreground text-xs">
                                    <Download className="h-3 w-3 mr-1" /> CSV
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {funnel.map((step, i) => (
                                        <div key={step.event} className="flex items-center gap-4">
                                            <div className="w-36 text-xs text-muted-foreground">{step.label}</div>
                                            <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, (step.count / Math.max(1, funnel[0]?.count)) * 100)}%` }}
                                                />
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                                                    {step.count.toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="w-16 text-right text-xs">
                                                {step.conversionRate !== null ? (
                                                    <span className={step.conversionRate < 50 ? 'text-red-400' : step.conversionRate < 80 ? 'text-yellow-400' : 'text-green-400'}>
                                                        {step.conversionRate}%
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground/60">—</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Retention */}
                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-sm text-foreground flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-green-400" /> Retención
                                </CardTitle>
                                <div className="flex gap-2">
                                    {latestRetention && (
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-green-400">D1: {latestRetention.d1Percent}%</span>
                                            <span className="text-yellow-400">D7: {latestRetention.d7Percent}%</span>
                                            <span className="text-red-400">D30: {latestRetention.d30Percent}%</span>
                                        </div>
                                    )}
                                    <Button variant="ghost" size="sm" onClick={() => exportAnalyticsCSV('retention')} className="text-muted-foreground text-xs">
                                        <Download className="h-3 w-3 mr-1" /> CSV
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="max-h-64 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="text-muted-foreground border-b border-border">
                                            <th className="text-left py-2">Fecha</th>
                                            <th className="text-right py-2">Nuevos</th>
                                            <th className="text-right py-2">D1</th>
                                            <th className="text-right py-2">D7</th>
                                            <th className="text-right py-2">D30</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {retention.slice(-14).map(row => (
                                            <tr key={row.date} className="border-b border-border/50">
                                                <td className="py-1.5 text-muted-foreground">{row.date}</td>
                                                <td className="py-1.5 text-right">{row.newUsers}</td>
                                                <td className="py-1.5 text-right">
                                                    <span className={row.d1Percent < 30 ? 'text-red-400' : row.d1Percent < 60 ? 'text-yellow-400' : 'text-green-400'}>
                                                        {row.d1Percent}%
                                                    </span>
                                                </td>
                                                <td className="py-1.5 text-right">
                                                    <span className={row.d7Percent < 15 ? 'text-red-400' : row.d7Percent < 40 ? 'text-yellow-400' : 'text-green-400'}>
                                                        {row.d7Percent}%
                                                    </span>
                                                </td>
                                                <td className="py-1.5 text-right">
                                                    <span className={row.d30Percent < 5 ? 'text-red-400' : row.d30Percent < 20 ? 'text-yellow-400' : 'text-green-400'}>
                                                        {row.d30Percent}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {retention.length === 0 && (
                                            <tr><td colSpan={5} className="text-center py-4 text-muted-foreground/60">No hay datos de retención aún</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </>
                )}
            </main>
        </div>
    );
}
