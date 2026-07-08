"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/use-matches';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';
import { hapticsLight, hapticsMedium } from '@/lib/mobile';
import { Badge } from '@/components/ui/badge';

/**
 * MatchesPage displays all current matches and incoming likes in a visual grid/carousel.
 */
export default function MatchesPage() {
    const { user } = useAuth();
    const { matches, newMatches, loading, error, refresh } = useMatches();
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const startYRef = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (containerRef.current && containerRef.current.scrollTop === 0) {
            startYRef.current = e.touches[0].clientY;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (startYRef.current === 0) return;
        const diff = e.touches[0].clientY - startYRef.current;
        if (diff > 0) setPullDistance(Math.min(diff * 0.4, 80));
    }, []);

    const handleTouchEnd = useCallback(async () => {
        if (pullDistance > 50) {
            setIsRefreshing(true);
            hapticsLight();
            await refresh();
            setIsRefreshing(false);
        }
        setPullDistance(0);
        startYRef.current = 0;
    }, [pullDistance, refresh]);

    if (!user) return null;

    return (
        <div
            ref={containerRef}
            className="min-h-dvh bg-background pb-20 md:pb-0 md:ml-60 flex flex-col overflow-y-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to Refresh Indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="flex items-center justify-center py-2 transition-all overflow-hidden" style={{ height: isRefreshing ? 40 : pullDistance }}>
                    <Loader2 className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} />
                </div>
            )}

            {/* Sticky Glass Header */}
            <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/90 px-4 backdrop-blur-md pt-safe glass">
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)' }}
                />
                <div className="flex items-center justify-between w-full max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-headline font-bold text-gradient">Conexiones</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5 opacity-70">
                            {matches.length} CONEXIÓN{matches.length !== 1 ? 'ES' : ''}
                        </p>
                    </div>
                    {matches.length > 0 && (
                        <div
                            className="h-8 min-w-[32px] px-2 rounded-full flex items-center justify-center shadow-glow-sm"
                            style={{ background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)' }}
                        >
                            <span className="text-white text-xs font-black">{matches.length}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-8 flex-1">
                {error && matches.length === 0 && (
                    <Alert variant="destructive" className="rounded-2xl border-none bg-destructive/10 text-destructive animate-in slide-in-from-top-2">
                        <AlertDescription className="flex items-center justify-between font-medium">
                            <span>Error al sincronizar conexiones.</span>
                            <Button variant="ghost" size="sm" onClick={() => refresh()} className="font-bold hover:bg-destructive/20">Reintentar</Button>
                        </AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="h-14 w-14 rounded-3xl flex items-center justify-center animate-glow-pulse bg-primary/5">
                            <Loader2 className="h-7 w-7 animate-spin text-primary" />
                        </div>
                        <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Sincronizando...</p>
                    </div>
                ) : (
                    <>
                        {/* Incoming Likes Section */}
                        {newMatches.length > 0 ? (
                            <section className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80">Personas que te gustaron</h2>
                                    <Badge variant="default" className="bg-primary/10 text-primary border-none text-[10px] font-black px-1.5 h-4">
                                        {newMatches.length}
                                    </Badge>
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-smooth overscroll-x-contain scrollbar-hide">
                                    <AnimatePresence>
                                        {newMatches.map((match, i) => (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                                transition={{ delay: i * 0.05, type: 'spring', stiffness: 280, damping: 26 }}
                                                className="snap-start shrink-0"
                                            >
                                                <Link href={`/profile/${match.id}?source=likes-received`}>
                                                    <motion.div
                                                        whileTap={{ scale: 0.93 }}
                                                        onClick={() => hapticsLight()}
                                                        className="flex flex-col items-center gap-2 group"
                                                    >
                                                        <div
                                                            className="relative h-20 w-20 rounded-full p-[2.5px] transition-transform duration-300 group-hover:scale-105"
                                                            style={{
                                                                background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)',
                                                                boxShadow: '0 8px 24px -4px hsl(335 85% 76% / 0.4)',
                                                            }}
                                                        >
                                                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                                                                <SafeImage
                                                                    src={match.photoURL || '/placeholder.svg'}
                                                                    alt={match.displayName}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            {match.type === 'superlike' && (
                                                                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1.5 shadow-md border-2 border-background animate-in zoom-in duration-500">
                                                                    <span className="text-[10px]">💘</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tight text-center max-w-[80px] truncate text-muted-foreground group-hover:text-primary transition-colors">
                                                            {match.displayName}
                                                        </span>
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                <div className="separator-gradient opacity-20 mt-4" />
                            </section>
                        ) : (
                            <section className="animate-in fade-in duration-700">
                                <div className="rounded-3xl border border-dashed border-border/60 bg-muted/5 p-6 flex flex-col items-center text-center">
                                    <div className="bg-muted/10 p-3 rounded-2xl mb-3">
                                        <UserPlus className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1">Sin nuevos likes recibidos</p>
                                    <p className="text-[10px] text-muted-foreground/60 max-w-[180px]">Mejora tu perfil o usa Flechados para llamar más la atención.</p>
                                </div>
                            </section>
                        )}

                        {/* All Matches Grid */}
                        <section className="animate-in fade-in duration-700 delay-200">
                            <h2 className="text-[11px] font-black uppercase tracking-[0.15em] text-foreground/80 mb-5 flex items-center gap-2">
                                <Heart className="h-3.5 w-3.5 text-primary fill-primary/20" />
                                Todas tus Conexiones
                            </h2>
                            
                            {matches.length === 0 ? (
                                <div
                                    className="rounded-[2.5rem] p-12 text-center border border-border/40 relative overflow-hidden glass"
                                    style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.05) 0%, hsl(280 60% 70% / 0.03) 100%)' }}
                                >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 opacity-30 bg-primary/20 blur-[60px] rounded-full" />
                                    
                                    <div className="relative z-10 flex flex-col items-center">
                                        <motion.div
                                            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                            className="h-20 w-20 rounded-3xl flex items-center justify-center mb-6 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 shadow-glow-sm"
                                        >
                                            <Heart className="h-10 w-10 text-primary/40 fill-primary/10" />
                                        </motion.div>
                                        
                                        <p className="text-xl font-headline font-bold text-foreground mb-2">Sin conexiones aún</p>
                                        <p className="text-sm text-muted-foreground mb-8 max-w-[240px] mx-auto leading-relaxed">
                                            Tu alma gemela está ahí fuera. Sigue explorando perfiles para conectar.
                                        </p>
                                        
                                        <Link href="/discover">
                                            <Button 
                                                onClick={() => hapticsMedium()}
                                                className="rounded-full px-10 h-12 font-bold shadow-glow hover:scale-105 active:scale-95 transition-all"
                                            >
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Empezar a Explorar
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <AnimatePresence>
                                        {matches.map((match, i) => {
                                            const otherUser = match.partner;
                                            return (
                                                <motion.div
                                                    key={match.id}
                                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 260, damping: 28 }}
                                                >
                                                    <Link href={`/chat/${match.id}`}>
                                                        <motion.div
                                                            whileTap={{ scale: 0.96 }}
                                                            onClick={() => hapticsLight()}
                                                            className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-muted group shadow-md border border-border/40 hover:shadow-xl transition-all duration-500"
                                                        >
                                                            <SafeImage
                                                                src={otherUser?.photoURL || '/placeholder.svg'}
                                                                alt={otherUser?.displayName || 'Conexión'}
                                                                fill
                                                                sizes="(max-width: 640px) 50vw, 25vw"
                                                                className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                                            />
                                                            
                                                            {/* High-quality gradient overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                                                            
                                                            <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                                                                <p className="text-white font-bold text-sm truncate drop-shadow-sm">
                                                                    {otherUser?.displayName}
                                                                </p>
                                                                {match.lastMessage ? (
                                                                    <p className="text-white/70 text-[10px] font-medium truncate mt-0.5 line-clamp-1">
                                                                        {match.lastMessage.content}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-primary-foreground/60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                                        ¡Nueva Conexión!
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* New message indicator */}
                                                            {(match.unreadCount ?? 0) > 0 && (
                                                                <div className="absolute top-3 right-3 bg-primary text-white rounded-full h-6 min-w-[24px] flex items-center justify-center p-1 text-[10px] font-black shadow-glow border-2 border-background">
                                                                    {match.unreadCount}
                                                                </div>
                                                            )}
                                                            
                                                            {!(match.unreadCount ?? 0) && match.lastMessage && (
                                                                <div className="absolute top-3 right-3 bg-white/10 backdrop-blur-md rounded-2xl p-2 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 border border-white/10">
                                                                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </Link>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
