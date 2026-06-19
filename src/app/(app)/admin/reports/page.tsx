'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Flag, ShieldAlert, Shield, Ban, EyeOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Image from 'next/image';

interface Report {
    id: string; reason: string; status: string; createdAt: string; reportCount: number; details?: string;
    reporter: { id: string; email: string; name: string | null };
    reported: { id: string; email: string; name: string | null; profile: { displayName: string | null; photos: string[]; trustStatus: string; isVerified: boolean; reputationScore: number } | null };
}

export default function AdminReportsPage() {
    const router = useRouter();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

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

    const statusColor = (s: string) => {
        switch (s) {
            case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 'reviewed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'dismissed': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
            case 'resolved': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-gray-500/10 text-gray-400';
        }
    };

    const trustColor = (s: string) => {
        switch (s) {
            case 'clean': return 'text-green-400';
            case 'watchlist': return 'text-amber-400';
            case 'banned': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 text-red-400" />
                    <h1 className="text-xl font-bold">Reportes</h1>
                </div>
                <div className="flex gap-2 ml-auto">
                    {['pending', 'reviewed', 'dismissed', 'resolved'].map(s => (
                        <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}
                            className={filter === s ? '' : 'border-gray-700 text-gray-400'}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </Button>
                    ))}
                </div>
            </header>

            <main className="p-6 max-w-5xl mx-auto space-y-3">
                {loading ? (
                    [1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-gray-800" />)
                ) : reports.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p>No hay reportes {filter === 'pending' ? 'pendientes' : 'en este estado'}</p>
                    </div>
                ) : (
                    reports.map(report => (
                        <div key={report.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="relative h-10 w-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
                                        {report.reported?.profile?.photos?.[0] ? (
                                            <Image src={report.reported.profile.photos[0]} alt="" fill className="object-cover" loading="lazy" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-600 text-xs">
                                                {report.reported?.profile?.displayName?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">{report.reported?.profile?.displayName || 'Unknown'}</span>
                                            <Badge variant="outline" className={trustColor(report.reported?.profile?.trustStatus || '')}>
                                                {report.reported?.profile?.trustStatus}
                                            </Badge>
                                            <span className="text-xs text-gray-500">Score: {report.reported?.profile?.reputationScore}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                            <Badge variant="outline" className="text-xs border-gray-700">{report.reason}</Badge>
                                            <span>Reportes: {report.reportCount}</span>
                                            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        {report.details && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{report.details}</p>
                                        )}
                                        <div className="text-xs text-gray-600 mt-1">
                                            Reportado por: {report.reporter?.email || 'Unknown'}
                                        </div>
                                    </div>
                                </div>
                                <Badge variant="outline" className={statusColor(report.status)}>
                                    {report.status}
                                </Badge>
                            </div>

                            {filter === 'pending' && (
                                <div className="flex gap-2 pt-2 border-t border-gray-800">
                                    <Button variant="outline" size="sm" onClick={() => handleAction(report.id, 'ignore')}
                                        className="border-gray-700 text-gray-400 hover:text-white text-xs">
                                        <XCircle className="h-3 w-3 mr-1" /> Ignorar
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAction(report.id, 'warn')}
                                        className="border-amber-500/30 text-amber-400 hover:text-amber-300 text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" /> Advertir
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAction(report.id, 'shadowban')}
                                        className="border-gray-600 text-gray-300 hover:text-white text-xs">
                                        <EyeOff className="h-3 w-3 mr-1" /> Shadowban
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAction(report.id, 'suspend')}
                                        className="border-orange-500/30 text-orange-400 hover:text-orange-300 text-xs">
                                        <ShieldAlert className="h-3 w-3 mr-1" /> Suspender
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleAction(report.id, 'ban')}
                                        className="border-red-500/30 text-red-400 hover:text-red-300 text-xs">
                                        <Ban className="h-3 w-3 mr-1" /> Banear
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}
