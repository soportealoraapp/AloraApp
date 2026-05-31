"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatches } from "@/hooks/use-matches";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Heart, X, CheckCircle, Loader2, MessageSquare, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { LikesReceivedList } from "@/components/match/LikesReceivedList";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";

export default function ChatPage() {
    const { user } = useAuth();
    const { matches, newMatches, loading, sendLike, refresh } = useMatches();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const [processingMatch, setProcessingMatch] = useState<string | null>(null);
    const [hidingMatch, setHidingMatch] = useState<string | null>(null);
    const [hiddenMatches, setHiddenMatches] = useState<Set<string>>(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('hiddenMatches');
            return stored ? new Set(JSON.parse(stored)) : new Set();
        }
        return new Set();
    });

    const filteredMatches = matches.filter((match) => {
        if (hiddenMatches.has(match.id)) return false;
        if (!searchTerm.trim()) return true;
        const partnerName = match.partner?.displayName || '';
        return partnerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleAcceptMatch = async (like: any) => {
        setProcessingMatch(like.fromUserId);
        try {
            await sendLike(like.fromUserId, 'like');
            toast({
                title: "¡Nuevo match! 🎉",
                description: "Ahora pueden chatear",
            });
            refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo aceptar el match",
            });
        } finally {
            setProcessingMatch(null);
        }
    };

    const handleRejectMatch = async (like: any) => {
        toast({
            title: "Match rechazado",
            description: "No volverás a ver este perfil",
        });
        refresh();
    };

    const handleHideConversation = async (matchId: string) => {
        setHidingMatch(matchId);
        try {
            const newHidden = new Set(hiddenMatches);
            newHidden.add(matchId);
            setHiddenMatches(newHidden);
            localStorage.setItem('hiddenMatches', JSON.stringify([...newHidden]));

            await fetch('/api/chat/hide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId }),
            });

            toast({
                title: "Conversación eliminada",
                description: "La conversación se ocultó de tu lista",
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo eliminar la conversación",
            });
        } finally {
            setHidingMatch(null);
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">Conversaciones</h1>
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                    ))}
                </main>
            </div>
        );
    }

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Conversaciones</h1>
            </header>

            <main className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar conversaciones..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="conversations">
                            Conversaciones ({matches.length})
                        </TabsTrigger>
                        <TabsTrigger value="new">
                            Nuevos
                            {newMatches.length > 0 && (
                                <Badge variant="default" className="ml-2 rounded-full h-5 w-5 flex items-center justify-center p-0 text-[10px]">
                                    {newMatches.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-3 mt-4">
                        {filteredMatches.length === 0 ? (
                            <Card className="rounded-3xl border bg-muted/20">
                                <CardContent className="flex flex-col items-center justify-center py-16 px-8">
                                    <div className="bg-card p-4 rounded-full shadow-sm mb-6">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <p className="text-xl font-bold text-foreground text-center mb-2">
                                        {BRAND_VOICE.states.noMatches.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground text-center max-w-xs mb-8">
                                        {BRAND_VOICE.states.noMatches.subtitle}
                                    </p>
                                    <Button asChild className="rounded-full px-8 h-12">
                                        <Link href="/discover">Explorar perfiles</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {filteredMatches.map((match, idx) => {
                                        const otherUserId = match.users.find(id => id !== user?.id);
                                        const partnerName = match.partner?.displayName || `Usuario #${otherUserId?.slice(0, 8)}`;
                                        const partnerPhoto = match.partner?.photoURL || '/placeholder.svg';
                                        return (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 180, damping: 35 }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/chat/${match.id}`} className="flex-1">
                                                        <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
                                                            <CardContent className="flex items-center gap-4 p-4">
                                                                <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-muted">
                                                                    <Image
                                                                        src={partnerPhoto}
                                                                        alt={partnerName}
                                                                        fill
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="font-bold text-foreground truncate">{partnerName}</p>
                                                                        <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                                                                            {match.compatibility}% compatible
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground truncate italic">
                                                                        {match.lastMessage?.content || `¡Es un match! ${BRAND_VOICE.nudges.newMatch}`}
                                                                    </p>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleHideConversation(match.id);
                                                        }}
                                                        disabled={hidingMatch === match.id}
                                                    >
                                                        {hidingMatch === match.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4 mt-4">
                        <LikesReceivedList />

                        <div className="pt-4 border-t">
                            <h4 className="font-bold text-sm mb-3 text-muted-foreground">Matches Recientes</h4>
                            {newMatches.length === 0 ? (
                                <p className="text-center py-8 text-sm text-muted-foreground">No tienes matches pendientes de respuesta.</p>
                            ) : (
                                <div className="space-y-2">
                                    {newMatches.map((like: any) => (
                                        <Card key={like.id}>
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <Link href={`/profile/${like.fromUserId || like.id}?source=new-match`} className="flex items-center gap-4 flex-1">
                                                    <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-muted">
                                                        <Image
                                                            src={like.photoURL || '/placeholder.svg'}
                                                            alt={like.displayName || 'Perfil'}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold truncate">{like.displayName || `Usuario #${(like.fromUserId || like.id).slice(0, 8)}`}</p>
                                                            {like.type === 'superlike' && (
                                                                <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                                                                    Super Like
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            Match mutuo • Chatea ahora
                                                        </p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleRejectMatch(like);
                                                        }}
                                                        disabled={processingMatch === like.fromUserId}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        className="bg-pink-500 text-white rounded-full"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleAcceptMatch(like);
                                                        }}
                                                        disabled={processingMatch === like.fromUserId}
                                                    >
                                                        {processingMatch === like.fromUserId ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <MessageSquare className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
