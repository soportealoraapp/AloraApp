'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/use-matches';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SafeImage } from '@/components/ui/safe-image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useCallback } from 'react';

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
            className="min-h-dvh bg-background pb-20 md:pb-0 md:ml-60"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull to refresh indicator */}
            {(pullDistance > 0 || isRefreshing) && (
                <div className="flex items-center justify-center py-2 transition-all" style={{ height: isRefreshing ? 40 : pullDistance }}>
                    <Loader2 className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: isRefreshing ? undefined : `rotate(${pullDistance * 3}deg)` }} />
                </div>
            )}

            {/* Header */}
            <header
                className="sticky top-0 z-30 pt-safe"
                style={{
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    background: 'hsl(var(--background) / 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                {/* Gradient top border accent */}
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)' }}
                />
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <div>
                        <h1 className="text-xl font-headline font-bold text-gradient">Conexiones</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {matches.length} conexión{matches.length !== 1 ? 'es' : ''}
                        </p>
                    </div>
                    {matches.length > 0 && (
                        <div
                            className="h-8 w-8 rounded-full flex items-center justify-center"
                            style={{ background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)' }}
                        >
                            <span className="text-white text-xs font-bold">{matches.length}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-5 space-y-7">
                {error && matches.length === 0 && (
                    <Alert variant="destructive" className="rounded-2xl">
                        <AlertDescription className="flex items-center justify-between">
                            <span>Error al cargar las conexiones. Intenta de nuevo.</span>
                            <Button variant="outline" size="sm" onClick={() => refresh()}>Reintentar</Button>
                        </AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div
                            className="h-12 w-12 rounded-full flex items-center justify-center animate-glow-pulse"
                            style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.15) 0%, hsl(280 60% 70% / 0.1) 100%)' }}
                        >
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Incoming Likes Section */}
                        {newMatches.length > 0 && (
                            <section>
                                <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-bold text-foreground">Personas que te gustaron</h2>
                                    <span
                                        className="text-xs font-bold text-primary-foreground px-2 py-0.5 rounded-full"
                                        style={{ background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)' }}
                                    >
                                        {newMatches.length}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">Da like para crear una conexión</p>
                                <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-hide">
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
                                                        className="flex flex-col items-center gap-2"
                                                    >
                                                        <div
                                                            className="relative h-20 w-20 rounded-full overflow-hidden"
                                                            style={{
                                                                padding: '2px',
                                                                background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)',
                                                                boxShadow: '0 4px 16px hsl(335 85% 76% / 0.4)',
                                                            }}
                                                        >
                                                            <div className="w-full h-full rounded-full overflow-hidden">
                                                                <SafeImage
                                                                    src={match.photoURL || '/placeholder.svg'}
                                                                    alt={match.displayName}
                                                                    fill
                                                                    sizes="80px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                            {match.type === 'superlike' && (
                                                                <div className="absolute -bottom-0.5 -right-0.5 bg-amber-500 text-white rounded-full p-1 shadow-sm border-2 border-background">
                                                                    <span className="text-[8px]">💘</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className="text-xs font-semibold text-center max-w-[72px] truncate">
                                                            {match.displayName}
                                                        </span>
                                                    </motion.div>
                                                </Link>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                                {/* Separator */}
                                <div className="separator-gradient mt-5" />
                            </section>
                        )}

                        {/* All Matches Grid */}
                        <section>
                            <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <Heart className="h-4 w-4 text-primary fill-primary/30" />
                                Todas tus Conexiones
                            </h2>
                            {matches.length === 0 ? (
                                <div
                                    className="rounded-3xl p-10 text-center border border-dashed border-border/60 relative overflow-hidden"
                                    style={{ background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.04) 0%, hsl(280 60% 70% / 0.03) 100%)' }}
                                >
                                    {/* Decorative glow */}
                                    <div
                                        className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-20 opacity-40"
                                        style={{ background: 'radial-gradient(ellipse, hsl(335 85% 76% / 0.5) 0%, transparent 70%)' }}
                                    />
                                    <div className="relative z-10">
                                        <motion.div
                                            animate={{ scale: [1, 1.08, 1] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="inline-block mb-5"
                                        >
                                            <div
                                                className="h-20 w-20 rounded-full flex items-center justify-center mx-auto"
                                                style={{
                                                    background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.15) 0%, hsl(280 60% 70% / 0.1) 100%)',
                                                    boxShadow: '0 0 32px hsl(335 85% 76% / 0.2)',
                                                }}
                                            >
                                                <Heart className="h-10 w-10 text-primary/40" />
                                            </div>
                                        </motion.div>
                                        <p className="text-lg font-bold text-foreground mb-2">Sin conexiones aún</p>
                                        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
                                            Sigue explorando perfiles para encontrar tu conexión perfecta
                                        </p>
                                        <Link href="/discover">
                                            <Button className="rounded-full px-8">
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Explorar
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <AnimatePresence>
                                        {matches.map((match, i) => {
                                            const otherUser = match.partner;
                                            return (
                                                <motion.div
                                                    key={match.id}
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 280, damping: 26 }}
                                                >
                                                    <Link href={`/chat/${match.id}`}>
                                                        <motion.div
                                                            whileTap={{ scale: 0.96 }}
                                                            className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted group"
                                                            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                                                        >
                                                            <SafeImage
                                                                src={otherUser?.photoURL || '/placeholder.svg'}
                                                                alt={otherUser?.displayName || 'Conexión'}
                                                                fill
                                                                sizes="(max-width: 640px) 50vw, 25vw"
                                                                className="object-cover transition-transform duration-400 group-hover:scale-105"
                                                            />
                                                            <div
                                                                className="absolute inset-0"
                                                                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }}
                                                            />
                                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                                <p className="text-white font-bold text-sm truncate">
                                                                    {otherUser?.displayName}
                                                                </p>
                                                                {match.lastMessage && (
                                                                    <p className="text-white/60 text-xs truncate mt-0.5">
                                                                        {match.lastMessage.content}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            {match.lastMessage && (
                                                                <div className="absolute top-2.5 right-2.5 bg-white/20 backdrop-blur-sm rounded-full p-1.5">
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
