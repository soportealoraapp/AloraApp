'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useMatches } from '@/hooks/use-matches';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function MatchesPage() {
    const { user } = useAuth();
    const { matches, newMatches, loading } = useMatches();

    if (!user) return null;

    return (
        <div className="min-h-dvh bg-background pb-20 md:pb-0 md:ml-60">
            <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl pt-safe">
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <h1 className="text-xl font-headline font-bold">Conexiones</h1>
                    <span className="text-sm text-muted-foreground">
                        {matches.length} conexión{matches.length !== 1 ? 'es' : ''}
                    </span>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* New Matches Section */}
                        {newMatches.length > 0 && (
                            <section>
                                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    Nuevas Conexiones
                                </h2>
                                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x">
                                    {newMatches.map((match) => (
                                        <Link
                                            key={match.id}
                                            href={`/chat/${match.id}`}
                                            className="snap-start shrink-0"
                                        >
                                            <motion.div
                                                whileTap={{ scale: 0.95 }}
                                                className="flex flex-col items-center gap-2"
                                            >
                                                <div className="relative h-20 w-20 rounded-full overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-background">
                                                    <Image
                                                        src={match.photoURL || '/placeholder.svg'}
                                                        alt={match.displayName}
                                                        fill
                                                        sizes="80px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-center max-w-[80px] truncate">
                                                    {match.displayName}
                                                </span>
                                            </motion.div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* All Matches Grid */}
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
                                Todas tus Conexiones
                            </h2>
                            {matches.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                        <Heart className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                        <p className="text-lg font-bold mb-1">Sin conexiones aún</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Sigue explorando perfiles para encontrar tu conexión
                                        </p>
                                        <Link href="/discover">
                                            <Button className="rounded-xl">
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Explorar
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {matches.map((match) => {
                                        const otherUser = match.partner;
                                        return (
                                            <Link
                                                key={match.id}
                                                href={`/chat/${match.id}`}
                                            >
                                                <motion.div
                                                    whileTap={{ scale: 0.97 }}
                                                    className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted group"
                                                >
                                                    <Image
                                                        src={otherUser?.photoURL || '/placeholder.svg'}
                                                        alt={otherUser?.displayName || 'Conexión'}
                                                        fill
                                                        sizes="(max-width: 640px) 50vw, 25vw"
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
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
                                                        <div className="absolute top-2 right-2">
                                                            <MessageSquare className="h-4 w-4 text-white/60" />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </>
                )}
            </main>
        </div>
    );
}
