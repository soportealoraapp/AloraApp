'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Heart, Loader2, Lock } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { PaywallModal } from '../premium/PaywallModal';
import { TrustBadge } from '../ui/premium/TrustBadge';

export function LikesReceivedList() {
    const { profile } = useAuth();
    const [likers, setLikers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaywall, setShowPaywall] = useState(false);
    const { toast } = useToast();

    const isPlus = profile?.subscriptionStatus === 'plus';

    useEffect(() => {
        if (isPlus) {
            fetchLikers();
        } else {
            setLoading(false);
        }
    }, [isPlus]);

    const fetchLikers = async () => {
        try {
            const res = await fetch('/api/match/likes-received');
            const data = await res.json();
            if (res.ok) {
                setLikers(data.likers || []);
            }
        } catch (error) {
            console.error("Error fetching likers", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isPlus) {
        return (
            <Card className="bg-gradient-to-br from-pink-50 to-orange-50 border-pink-100 overflow-hidden relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white p-3 rounded-2xl shadow-xl mb-4">
                        <Lock className="h-8 w-8 text-pink-500" />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">¿Quién te ha dado like?</h4>
                    <p className="text-sm text-gray-600 mb-6 max-w-[250px]">
                        Actualiza a Alora Plus para descubrir quién está esperando para hablar contigo.
                    </p>
                    <Button
                        onClick={() => setShowPaywall(true)}
                        className="bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-full font-bold px-8"
                    >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Ver Admiradores
                    </Button>
                </div>

                {/* Blurred mockup items */}
                <CardContent className="p-4 space-y-3 opacity-20 filter blur-[4px]">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gray-200" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-24 bg-gray-200 rounded" />
                                <div className="h-3 w-40 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </CardContent>
                <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
            </Card>
        );
    }

    if (loading) return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-pink-500 h-8 w-8" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <h4 className="font-bold text-sm flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />
                    Le gustas a {likers.length} personas
                </h4>
            </div>

            {likers.length === 0 ? (
                <Card className="rounded-3xl border-dashed bg-muted/20">
                    <CardContent className="py-12 text-center text-muted-foreground text-sm">
                        Aún no tienes nuevos admiradores. ¡Sigue explorando!
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    <AnimatePresence>
                        {likers.map((liker) => (
                            <motion.div
                                key={liker.id || liker.uid}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring", stiffness: 180, damping: 35 }}
                            >
                                <Card className="rounded-3xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group border-none shadow-sm active:scale-[0.98]">
                                    <div className="aspect-[4/5] relative">
                                        <Image
                                            src={liker.photos?.[0] || '/placeholder.jpg'}
                                            alt={liker.displayName}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-3 left-3 text-white flex flex-col gap-0.5">
                                            <div className="flex items-center gap-1.5">
                                                <p className="font-bold text-sm tracking-tight">{liker.displayName}, {liker.age}</p>
                                                {liker.isVerified && <TrustBadge type="verified" />}
                                            </div>
                                            <p className="text-[10px] opacity-80 font-medium">{liker.city}</p>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
