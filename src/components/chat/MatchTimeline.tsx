'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, X } from 'lucide-react';
import { BRAND_VOICE } from '@/lib/constants/brand-voice';

interface TimelineEvent {
    id: string;
    type: string;
    icon: string;
    title: string;
    description?: string;
    createdAt: string;
}

interface MatchTimelineProps {
    matchId: string;
    open: boolean;
    onClose: () => void;
}

export function MatchTimeline({ matchId, open, onClose }: MatchTimelineProps) {
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!open) return;
        const controller = new AbortController();
        setLoading(true);
        setError(false);
        fetch(`/api/chat/timeline?matchId=${matchId}`, { signal: controller.signal })
            .then(r => r.json())
            .then(data => setEvents(data.events || []))
            .catch(() => { if (!controller.signal.aborted) setError(true); })
            .finally(() => setLoading(false));
        return () => controller.abort();
    }, [matchId, open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label="Línea de tiempo">
            <Card className="w-full md:max-w-md md:rounded-3xl rounded-t-3xl rounded-b-none md:rounded-b-3xl max-h-[85vh] flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Línea de tiempo
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Cerrar">
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="overflow-y-auto flex-1">
                    {loading ? (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            No se pudo cargar la línea de tiempo.{' '}
                            <button onClick={() => window.location.reload()} className="underline font-medium text-primary">Reintentar</button>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-8 text-sm text-muted-foreground">
                            {BRAND_VOICE.states.noTimelineEvents.title}
                        </div>
                    ) : (
                        <div className="relative pl-6 space-y-4">
                            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                            {events.map((event, i) => (
                                <div key={event.id} className="relative flex items-start gap-3">
                                    <div className="absolute -left-6 mt-0.5 h-6 w-6 rounded-full bg-card border-2 border-primary/30 flex items-center justify-center text-sm z-10">
                                        {event.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 pl-2">
                                        <p className="text-sm font-semibold leading-tight">{event.title}</p>
                                        {event.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(event.createdAt).toLocaleString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
