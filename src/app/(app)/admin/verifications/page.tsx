'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ShieldCheck, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import Image from 'next/image';

interface Submission {
    id: string; selfieUrl: string; status: string; reason: string | null; createdAt: string;
    user: { id: string; email: string; name: string | null; profile: { displayName: string | null; age: number | null; gender: string | null; photos: string[]; trustStatus: string; isVerified: boolean } | null };
}

export default function AdminVerificationsPage() {
    const router = useRouter();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

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

    const handleAction = async (submissionId: string, action: string) => {
        try {
            await fetch('/api/admin/verifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, action }),
            });
            loadSubmissions(filter);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="min-h-dvh bg-background text-foreground">
            <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/admin')} className="text-muted-foreground">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    <h1 className="text-xl font-bold">Verificaciones</h1>
                </div>
                <div className="flex gap-2 ml-auto">
                    {['pending', 'approved', 'rejected'].map(s => (
                        <Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}
                            className={filter === s ? '' : 'border-border text-muted-foreground'}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
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
                        <p>No hay verificaciones pendientes</p>
                    </div>
                ) : (
                    submissions.map(sub => (
                        <div key={sub.id} className="bg-card border border-border rounded-xl p-5 space-y-4">
                            <div className="flex items-start gap-6">
                                <div className="relative h-40 w-32 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                                    <Image src={sub.selfieUrl} alt="Selfie" fill className="object-cover" loading="lazy" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                            {sub.user.profile?.photos?.[0] ? (
                                                <Image src={sub.user.profile.photos[0]} alt="" fill className="object-cover" loading="lazy" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{sub.user.profile?.displayName || 'Unknown'}</span>
                                            <div className="text-xs text-muted-foreground">
                                                {sub.user.email} · {sub.user.profile?.age} años · {sub.user.profile?.gender}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                        <Badge variant="outline" className={`text-xs ${sub.user.profile?.isVerified ? 'border-emerald-500/30 text-emerald-400' : 'border-border text-muted-foreground'}`}>
                                            {sub.user.profile?.isVerified ? 'Verified' : 'Unverified'}
                                        </Badge>
                                        <Badge variant="outline" className="text-xs border-border">{sub.user.profile?.trustStatus}</Badge>
                                        <span className="text-xs">Enviado: {new Date(sub.createdAt).toLocaleDateString()}</span>
                                    </div>

                                    {sub.user.profile && sub.user.profile.photos.length > 0 && (
                                        <div className="flex gap-2 mt-3">
                                            {sub.user.profile.photos.slice(0, 4).map((photo, i) => (
                                                <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden bg-muted">
                                                    <Image src={photo} alt={`Photo ${i}`} fill className="object-cover" loading="lazy" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {filter === 'pending' && (
                                <div className="flex gap-2 pt-3 border-t border-border">
                                    <Button onClick={() => handleAction(sub.id, 'approve')}
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                                        <CheckCircle className="h-3 w-3 mr-1" /> Aprobar
                                    </Button>
                                    <Button onClick={() => handleAction(sub.id, 'reject')}
                                        variant="outline" className="border-red-500/30 text-red-400 hover:text-red-300 text-xs">
                                        <XCircle className="h-3 w-3 mr-1" /> Rechazar
                                    </Button>
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
