'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, RotateCcw, UserX, Loader2 } from 'lucide-react';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { useSendLike } from '@/hooks/use-send-like';
import { useToast } from '@/hooks/use-toast';
import { ConnectionIntent } from '@/lib/domain/types';

interface SecondChanceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    intent?: ConnectionIntent;
}

interface PassedProfile {
    id: string;
    displayName: string;
    age?: number;
    photos?: string[];
    intent?: ConnectionIntent;
}

export function SecondChanceModal({ open, onOpenChange, intent = 'dating' }: SecondChanceModalProps) {
    const [passedProfiles, setPassedProfiles] = useState<PassedProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const { sendLike } = useSendLike();
    const { toast } = useToast();

    const load = useCallback(async (cursor?: string | null) => {
        cursor ? setLoadingMore(true) : setLoading(true);
        try {
            const url = `/api/match/passed?intent=${intent}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            const list: PassedProfile[] = data.profiles || [];
            setPassedProfiles(prev => cursor ? [...prev, ...list] : list);
            setHasMore(!!data.hasMore);
            setNextCursor(data.nextCursor ?? null);
        } catch {
            if (!cursor) setPassedProfiles([]);
        } finally {
            cursor ? setLoadingMore(false) : setLoading(false);
        }
    }, [intent]);

    useEffect(() => {
        if (!open) return;
        load();
    }, [open, load]);

    const handleLike = async (profileId: string, pIntent: ConnectionIntent = 'dating') => {
        try {
            const result = await sendLike(profileId, 'like', pIntent, false);
            if (result?.matched) {
                toast({ title: '¡Match!', description: '¡Ahora pueden chatear!', duration: 5000 });
            } else {
                toast({ title: '¡Me gusta enviado!' });
            }
            setPassedProfiles(prev => prev.filter(p => p.id !== profileId));
        } catch {
            toast({ title: 'Error', variant: 'destructive' });
        }
    };

    const handleDefinitivePass = async (profileId: string) => {
        const previous = passedProfiles;
        setPassedProfiles(prev => prev.filter(p => p.id !== profileId));
        toast({ title: 'Descartado definitivamente' });
        try {
            const res = await fetch('/api/match/passed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId }),
            });
            if (!res.ok) throw new Error('Failed');
        } catch {
            setPassedProfiles(previous);
            toast({ title: 'Error al descartar', variant: 'destructive' });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-primary" />
                        Segunda Oportunidad
                    </DialogTitle>
                    <DialogDescription>
                        Perfiles que descartaste. Si cambiaste de opinión, dales like para recuperarlos.
                        Al descartar desde aquí, el perfil se elimina definitivamente y no volverá a aparecer.
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : passedProfiles.length === 0 ? (
                    <div className="text-center py-10">
                        <RotateCcw className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                        <p className="font-semibold">No hay perfiles descartados</p>
                        <p className="text-sm text-muted-foreground">Los perfiles que pases aparecerán aquí para una segunda oportunidad.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-2">
                            {passedProfiles.map((profile) => (
                                <div key={profile.id} className="rounded-2xl overflow-hidden shadow-sm border">
                                    <Link href={`/profile/${profile.id}?source=second-chance`} className="block aspect-[3/4] relative" onClick={() => onOpenChange(false)}>
                                        <SafeImage
                                            src={profile.photos?.[0] || '/placeholder.svg'}
                                            alt={profile.displayName || ''}
                                            fill
                                            sizes="(max-width: 640px) 50vw, 33vw"
                                            className="object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                                        <div className="absolute bottom-2 left-2 text-white text-xs font-bold">
                                            {profile.displayName}, {profile.age}
                                        </div>
                                    </Link>
                                    <div className="flex gap-1 p-1.5">
                                        <Button size="sm" variant="ghost" className="flex-1 h-11" onClick={() => handleLike(profile.id, (profile.intent as ConnectionIntent) || 'dating')} aria-label="Dar like">
                                            <Heart className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="flex-1 h-11 text-destructive hover:text-destructive" onClick={() => handleDefinitivePass(profile.id)} aria-label="Descartar definitivamente" title="Descartar definitivamente">
                                            <UserX className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="text-center pt-2 pb-1">
                                <Button variant="outline" size="sm" onClick={() => load(nextCursor)} disabled={loadingMore}>
                                    {loadingMore ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                                    Cargar más
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
