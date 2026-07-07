'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, X, MessageCircle, Mic, Image, Calendar, Heart, Smile } from 'lucide-react';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';
import { motion } from 'framer-motion';

interface TimelineEvent {
    id: string;
    type: string;
    icon: string;
    title: string;
    description?: string;
    createdAt: string;
}

interface ChatStats {
    totalMessages: number;
    totalImages: number;
    totalVoice: number;
    totalReactions: number;
    daysConnected: number;
}

interface MatchTimelineProps {
    matchId: string;
    open: boolean;
    onClose: () => void;
}

export function MatchTimeline({ matchId, open, onClose }: MatchTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [stats, setStats] = useState<ChatStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        fetch(`/api/chat/timeline?matchId=${matchId}`, { signal: controller.signal })
            .then(r => { if (!r.ok) throw new Error('Failed to fetch'); return r.json(); })
            .then(data => {
                setEvents(data.events || []);
                setStats(data.stats || null);
            })
            .catch(() => { if (!controller.signal.aborted) setError(true); })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [matchId, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4" role="dialog" aria-modal="true" aria-label="Nuestra Historia">
            <motion.div
                initial={{ y: '100%', opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0.5 }}
                transition={{ type: 'spring', damping: 28, stiffness: 240 }}
                className="w-full md:max-w-lg md:rounded-3xl rounded-t-3xl bg-background border border-border/40 shadow-2xl max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/20 bg-muted/10">
                    <CardTitle className="text-lg font-headline font-bold flex items-center gap-2 text-gradient">
                        <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                        Nuestra Historia
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-9 w-9 rounded-xl hover:bg-secondary" aria-label="Cerrar">
                        <X className="h-5 w-5" />
                    </Button>
                </CardHeader>
                
                <CardContent className="overflow-y-auto flex-1 p-5 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium">Recorriendo los momentos...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-sm text-muted-foreground space-y-3">
                            <p>No se pudo cargar tu línea de tiempo.</p>
                            <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl">Reintentar</Button>
                        </div>
                    ) : (
                        <>
                            {/* Emotional Stats Dashboard */}
                            {stats && (
                                <div className="space-y-4">
                                    <div 
                                        className="rounded-2xl p-4 text-center border relative overflow-hidden"
                                        style={{
                                            background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.08) 0%, hsl(280 60% 70% / 0.04) 100%)',
                                            borderColor: 'hsl(335 85% 76% / 0.2)'
                                        }}
                                    >
                                        <div className="absolute top-2 right-2 text-primary/10">
                                            <Heart className="h-20 w-20 fill-current" />
                                        </div>
                                        <p className="text-xs uppercase font-bold tracking-widest text-primary/85 mb-1">Días conectando</p>
                                        <h3 className="text-4xl font-headline font-black text-gradient mb-1">
                                            {stats.daysConnected} {stats.daysConnected === 1 ? 'día' : 'días'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                                            {stats.totalMessages > 0 
                                                ? 'Cada mensaje ha sido un paso más cerca.' 
                                                : '¡Es momento de dar el primer paso!'}
                                        </p>
                                    </div>

                                    {/* Stats grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                        <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center text-center">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                                                <MessageCircle className="h-4.5 w-4.5" />
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{stats.totalMessages}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mensajes</span>
                                        </div>

                                        <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center text-center">
                                            <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500 mb-2">
                                                <Mic className="h-4.5 w-4.5" />
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{stats.totalVoice}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Audios</span>
                                        </div>

                                        <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center text-center">
                                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-2">
                                                <Image className="h-4.5 w-4.5" />
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{stats.totalImages}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Fotos</span>
                                        </div>

                                        <div className="bg-card border border-border/40 rounded-xl p-3 flex flex-col items-center text-center">
                                            <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2">
                                                <Smile className="h-4.5 w-4.5" />
                                            </div>
                                            <span className="text-lg font-bold text-foreground">{stats.totalReactions}</span>
                                            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Reacciones</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Timeline list */}
                            <div className="space-y-4">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5 px-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Hitos de la Conexión
                                </h4>

                                {events.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        {BRAND_VOICE.states.noTimelineEvents.title}
                                    </div>
                                ) : (
                                    <div className="relative pl-6 space-y-5">
                                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                                        {events.map((event, idx) => (
                                            <motion.div 
                                                key={event.id} 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.08 }}
                                                className="relative flex items-start gap-3"
                                            >
                                                <div 
                                                    className="absolute -left-6 mt-0.5 h-6 w-6 rounded-full bg-background border-2 flex items-center justify-center text-xs z-10 shadow-sm"
                                                    style={{ borderColor: 'hsl(335 85% 76% / 0.4)' }}
                                                >
                                                    {event.icon}
                                                </div>
                                                <div className="flex-1 min-w-0 pl-2 bg-card/45 border border-border/20 rounded-xl p-3 hover:border-primary/20 transition-all duration-200">
                                                    <p className="text-sm font-semibold leading-tight text-foreground">{event.title}</p>
                                                    {event.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.description}</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium">
                                                        {new Date(event.createdAt).toLocaleString('es-MX', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        })}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </motion.div>
        </div>
    );
}
