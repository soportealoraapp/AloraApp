'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Eye, Lock, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaywallModal } from '@/components/premium/PaywallModal';

interface Visitor {
    id: string;
    name: string;
    age: number;
    city: string;
    photo: string;
    isVerified: boolean;
    visitedAt: string;
}

export default function VisitorsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [total, setTotal] = useState(0);
    const [isPlus, setIsPlus] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (!user) return;
        fetch('/api/profile/visitors?limit=10')
            .then(r => r.json())
            .then(data => {
                setVisitors(data.visitors || []);
                setTotal(data.total || 0);
                setIsPlus(data.isPlus || false);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [user]);

    const hiddenCount = total - visitors.length;

    return (
        <div className="md:pl-60 p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Visitantes del perfil</h1>
                    <p className="text-sm text-muted-foreground">{total} persona{total !== 1 ? 's' : ''} visitó tu perfil</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-muted-foreground">Cargando...</div>
            ) : visitors.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Eye className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-semibold">Aún no tienes visitantes</p>
                        <p className="text-sm text-muted-foreground">Cuando alguien visite tu perfil, aparecerá aquí</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {visitors.map(visitor => (
                        <Link key={visitor.id} href={`/profile/${visitor.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="flex items-center gap-4 p-4">
                                    <Avatar className="h-14 w-14 border">
                                        <AvatarImage src={visitor.photo} alt={visitor.name} />
                                        <AvatarFallback>{visitor.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{visitor.name}, {visitor.age}</p>
                                        <p className="text-sm text-muted-foreground">{visitor.city}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(visitor.visitedAt).toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {!isPlus && hiddenCount > 0 && (
                        <Card className="border-dashed border-primary/30 bg-primary/5">
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <Lock className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-semibold text-sm">{hiddenCount} visitante{hiddenCount !== 1 ? 's' : ''} más</p>
                                        <p className="text-xs text-muted-foreground">Desbloquea con Alora+</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => setShowPaywall(true)}>
                                    <Sparkles className="h-4 w-4 mr-1" /> Ver todos
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
        </div>
    );
}
