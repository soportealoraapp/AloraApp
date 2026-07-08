"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMatches } from "@/hooks/use-matches";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2, MessageSquare, Bell, BellOff, Trash2, MoreVertical, Sparkles, Heart } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
const LikesReceivedList = dynamic(() => import("@/components/match/LikesReceivedList").then(m => m.LikesReceivedList), { ssr: false });
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { hapticsLight, hapticsMedium } from "@/lib/mobile";

/**
 * ChatPage manages the list of active conversations and new incoming likes.
 * It features pull-to-refresh, search, and swipe actions for conversation management.
 */
export default function ChatPage() {
    const { user } = useAuth();
    const { matches, newMatches, loading, sendLike, refresh } = useMatches();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const [processingMatch, setProcessingMatch] = useState<string | null>(null);
    const [hidingMatch, setHidingMatch] = useState<string | null>(null);
    const [showStaleOnly, setShowStaleOnly] = useState(false);
    const [dismissedStaleBanner, setDismissedStaleBanner] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectTarget, setRejectTarget] = useState<{ id: string; intent?: string } | null>(null);
    const [hideDialogOpen, setHideDialogOpen] = useState(false);
    const [hideTargetId, setHideTargetId] = useState<string | null>(null);

    // Pull to Refresh Logic
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

    const filteredMatches = useMemo(() => matches.filter((match) => {
        if (searchTerm.trim()) {
            const partnerName = match.partner?.displayName || '';
            if (!partnerName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        }
        if (showStaleOnly) {
            const lastMsg = match.lastMessage?.createdAt;
            if (!lastMsg) return false;
            const hours = (Date.now() - new Date(lastMsg).getTime()) / (1000 * 60 * 60);
            if (hours < 72) return false;
        }
        return true;
    }), [matches, searchTerm, showStaleOnly]);

    const staleMatches = useMemo(() => matches.filter((match) => {
        const lastMsg = match.lastMessage?.createdAt;
        if (!lastMsg) return false;
        const hours = (Date.now() - new Date(lastMsg).getTime()) / (1000 * 60 * 60);
        return hours >= 72;
    }), [matches]);

    const recentStaleMatches = useMemo(() => matches.filter((match) => {
        const lastMsg = match.lastMessage?.createdAt;
        if (!lastMsg) return false;
        const hours = (Date.now() - new Date(lastMsg).getTime()) / (1000 * 60 * 60);
        return hours >= 72 && hours <= 168;
    }), [matches]);

    const handleAcceptMatch = async (like: any) => {
        setProcessingMatch(like.fromUserId);
        try {
            await sendLike(like.fromUserId, 'like', like.intent || 'dating', false);
            hapticsMedium();
            const isFriendship = like.intent === 'friendship';
            toast({
                title: isFriendship ? "¡Nueva amistad! 🤝" : "¡Es un Match! 💖",
                description: isFriendship
                    ? `¡Genial! Tú y ${like.fromUser?.displayName || 'esta persona'} quieren conocerse como amigos.`
                    : `¡Genial! Tú y ${like.fromUser?.displayName || 'esta persona'} quieren conocerse.`,
            });
            refresh();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ups, algo salió mal",
                description: "No pudimos conectar en este momento. Inténtalo de nuevo.",
            });
        } finally {
            setProcessingMatch(null);
        }
    };

    const handleRejectMatch = async (like: any) => {
        setRejectTarget(like);
        setRejectDialogOpen(true);
    };

    const confirmRejectMatch = async () => {
        if (!rejectTarget) return;
        setRejectDialogOpen(false);
        try {
            await fetch('/api/match/like', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toUserId: rejectTarget.id,
                    type: 'pass',
                    intent: rejectTarget.intent || 'dating',
                }),
            });
            toast({
                title: "Perfil archivado",
                description: "Entendido, buscaremos mejores conexiones para ti.",
            });
            refresh();
        } catch {
            toast({
                title: "Error",
                description: "No se pudo archivar. Inténtalo de nuevo.",
                variant: "destructive"
            });
        }
        setRejectTarget(null);
    };

    const handleHideConversation = async (matchId: string) => {
        setHideTargetId(matchId);
        setHideDialogOpen(true);
    };

    const confirmHideConversation = async () => {
        if (!hideTargetId) return;
        setHidingMatch(hideTargetId);
        setHideDialogOpen(false);
        try {
            const response = await fetch('/api/chat/hide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId: hideTargetId }),
            });
            if (!response.ok) throw new Error('Failed to hide');
            refresh();
            toast({
                title: "Conversación ocultada",
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
            setHideTargetId(null);
        }
    };

    const handleMuteConversation = async (matchId: string, isCurrentlyMuted: boolean) => {
        try {
            const duration = isCurrentlyMuted ? -1 : null;
            const response = await fetch('/api/chat/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, duration }),
            });
            if (!response.ok) throw new Error('Failed to mute');
            toast({
                title: isCurrentlyMuted ? 'Notificaciones activadas' : 'Conversación silenciada',
                description: isCurrentlyMuted
                    ? 'Recibirás notificaciones de nuevos mensajes'
                    : 'No recibirás notificaciones de esta conversación',
            });
            refresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cambiar el silencio',
                variant: 'destructive',
            });
        }
    };

    if (loading && matches.length === 0) {
        return (
            <div className="animate-in fade-in duration-500">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                    <h1 className="text-xl font-headline font-bold text-gradient">Conversaciones</h1>
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                </main>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="flex min-h-dvh flex-col overflow-y-auto bg-background"
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

            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6 pt-safe glass">
                <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)' }}
                />
                <h1 className="text-xl font-headline font-bold text-gradient">Conversaciones</h1>
            </header>

            <main className="mx-auto flex-1 w-full max-w-3xl space-y-5 px-4 py-4 md:px-6 md:py-5">
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Buscar conversaciones..."
                        className="pl-9 rounded-2xl border-border/60 focus:ring-primary/20 bg-muted/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Stale Connection Nudge */}
                {recentStaleMatches.length > 0 && !showStaleOnly && !dismissedStaleBanner && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-accent/30 bg-accent/5 p-4 flex items-center justify-between gap-3 shadow-sm overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-3 relative z-10">
                            <div className="bg-accent/20 p-2 rounded-xl hidden xs:flex items-center justify-center">
                                <Sparkles className="h-4 w-4 text-accent-foreground" />
                            </div>
                            <div>
                                <p className="text-sm text-accent-foreground font-bold">¡Tienes conexiones esperando!</p>
                                <p className="text-[11px] text-accent-foreground/80 font-medium">Saluda y rompe el hielo hoy mismo.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 relative z-10">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-[10px] font-bold uppercase tracking-wider h-8 border-accent/40 bg-background/50 hover:bg-accent/10 whitespace-nowrap px-3"
                                onClick={() => { hapticsLight(); setShowStaleOnly(true); }}
                            >
                                Ver inactivas
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-accent-foreground/60 hover:text-accent-foreground"
                                onClick={() => setDismissedStaleBanner(true)}
                                aria-label="Cerrar"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </motion.div>
                )}

                {showStaleOnly && (
                    <div className="flex items-center justify-between animate-in fade-in slide-in-from-right-2">
                        <p className="text-sm text-muted-foreground font-medium">
                            Mostrando inactivas ({staleMatches.length})
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-bold text-primary hover:bg-primary/5 rounded-full"
                            onClick={() => { hapticsLight(); setShowStaleOnly(false); }}
                        >
                            Ver todas
                        </Button>
                    </div>
                )}

                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 p-1 bg-secondary/30 rounded-2xl border border-border/40">
                        <TabsTrigger 
                            value="conversations" 
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            onClick={() => hapticsLight()}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Chats</span>
                                <Badge variant="secondary" className="bg-muted/50 text-[10px] h-4 min-w-[16px] p-0 flex items-center justify-center font-bold">
                                    {matches.length}
                                </Badge>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger 
                            value="new" 
                            className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                            onClick={() => hapticsLight()}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold">Nuevos</span>
                                {newMatches.length > 0 && (
                                    <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] h-4 min-w-[16px] p-0 flex items-center justify-center font-bold shadow-glow-sm">
                                        {newMatches.length}
                                    </Badge>
                                )}
                            </div>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="mt-4 space-y-3 animate-in fade-in duration-300">
                        {filteredMatches.length === 0 ? (
                            <Card className="rounded-3xl border border-dashed bg-muted/10 py-12">
                                <CardContent className="flex flex-col items-center justify-center">
                                    <div className="bg-muted/20 p-5 rounded-3xl mb-4">
                                        <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-lg font-bold text-foreground mb-1">
                                        {searchTerm ? "Sin resultados" : BRAND_VOICE.states.noMatches.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground text-center max-w-[240px] mb-6">
                                        {searchTerm ? `No hay chats que coincidan con "${searchTerm}"` : BRAND_VOICE.states.noMatches.subtitle}
                                    </p>
                                    {!searchTerm && (
                                        <Button asChild className="rounded-full px-8 h-12 font-bold shadow-glow hover:scale-105 transition-transform">
                                            <Link href="/discover">Explorar perfiles</Link>
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence initial={false}>
                                    {filteredMatches.map((match, idx) => {
                                        const otherUserId = match.users.find(id => id !== user?.id);
                                        const partnerName = match.partner?.displayName || `Usuario #${otherUserId?.slice(0, 8)}`;
                                        const partnerPhoto = match.partner?.photoURL || '/placeholder.svg';
                                        const isMuted = match.mutedUntil && match.mutedByUserId === user?.id ? new Date(match.mutedUntil) > new Date() : false;

                                        return (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="relative overflow-hidden rounded-2xl group"
                                            >
                                                {/* Swipe Actions Background */}
                                                <div className="absolute inset-0 flex items-center justify-end gap-1.5 pr-2 bg-muted/30 z-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMuteConversation(match.id, isMuted)}
                                                        className={cn(
                                                            "h-[calc(100%-8px)] rounded-xl flex flex-col items-center justify-center px-4 text-white border-none shadow-sm transition-colors",
                                                            isMuted ? "bg-amber-500 hover:bg-amber-600" : "bg-blue-500 hover:bg-blue-600"
                                                        )}
                                                    >
                                                        {isMuted ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                                                        <span className="text-[9px] font-black uppercase tracking-tighter mt-1">{isMuted ? "Activar" : "Silenciar"}</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleHideConversation(match.id)}
                                                        disabled={hidingMatch === match.id}
                                                        className="bg-destructive hover:bg-destructive/90 text-white rounded-xl h-[calc(100%-8px)] flex flex-col items-center justify-center px-4 border-none shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter mt-1">Borrar</span>
                                                    </Button>
                                                </div>

                                                <motion.div
                                                    drag="x"
                                                    dragDirectionLock
                                                    dragConstraints={{ left: -160, right: 0 }}
                                                    dragElastic={{ left: 0.1, right: 0 }}
                                                    className="relative z-10 bg-background"
                                                >
                                                    <Link href={`/chat/${match.id}`} className="block">
                                                        <Card className="rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]">
                                                            <CardContent className="flex items-center gap-4 p-3.5">
                                                                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-muted shadow-sm">
                                                                    <SafeImage
                                                                        src={partnerPhoto}
                                                                        alt={partnerName}
                                                                        fill
                                                                        sizes="56px"
                                                                        className="object-cover"
                                                                    />
                                                                    {isMuted && (
                                                                        <div className="absolute top-0 right-0 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-background">
                                                                            <BellOff className="h-2.5 w-2.5" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <p className="font-bold text-foreground truncate">{partnerName}</p>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {(match.unreadCount ?? 0) > 0 && (
                                                                                <Badge variant="default" className="rounded-full h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] font-black shadow-glow-sm">
                                                                                    {(match.unreadCount ?? 0) > 99 ? '99+' : match.unreadCount}
                                                                                </Badge>
                                                                            )}
                                                                            {match.lastMessage?.createdAt && (() => {
                                                                                const hrs = (Date.now() - new Date(match.lastMessage.createdAt).getTime()) / 3600000;
                                                                                return hrs >= 72 ? (
                                                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-600 bg-amber-500/5 whitespace-nowrap font-bold uppercase">
                                                                                        Esperando
                                                                                    </Badge>
                                                                                ) : null;
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground truncate font-medium">
                                                                        {match.lastMessage?.content || (match.intent === 'friendship' ? '¡Nueva amistad! 👋' : `¡Saluda a tu conexión! 💖`)}
                                                                    </p>
                                                                </div>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground/60 hover:text-foreground rounded-full" onClick={(e) => e.preventDefault()}>
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end" className="rounded-xl">
                                                                        <DropdownMenuItem onClick={() => handleMuteConversation(match.id, isMuted)} className="text-xs font-medium">
                                                                            {isMuted ? <Bell className="h-3.5 w-3.5 mr-2" /> : <BellOff className="h-3.5 w-3.5 mr-2" />}
                                                                            {isMuted ? "Activar notificaciones" : "Silenciar"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleHideConversation(match.id)} className="text-destructive text-xs font-medium focus:bg-destructive/10 focus:text-destructive">
                                                                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                            Eliminar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </CardContent>
                                                        </Card>
                                                    </Link>
                                                </motion.div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="mt-4 space-y-5 animate-in fade-in duration-300">
                        <LikesReceivedList />

                        <div className="pt-6 border-t border-border/40">
                            <h4 className="font-black text-[10px] uppercase tracking-widest mb-4 text-muted-foreground flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-primary" />
                                Conexiones Recientes
                            </h4>
                            
                            {newMatches.length === 0 ? (
                                <div className="text-center py-10 px-6 bg-muted/10 rounded-3xl border border-dashed border-border/60">
                                    <div className="bg-muted/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Heart className="h-5 w-5 text-muted-foreground/40" />
                                    </div>
                                    <p className="text-sm font-bold text-foreground mb-1">Sin nuevas conexiones</p>
                                    <p className="text-xs text-muted-foreground mb-4">Sigue descubriendo personas increíbles en el feed.</p>
                                    <Button asChild variant="outline" className="rounded-full h-9 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                                        <Link href="/discover">Explorar ahora</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {newMatches.map((like: any) => (
                                        <motion.div key={like.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                                            <Card className="rounded-2xl border-border/40 overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.99]">
                                                <CardContent className="flex items-center gap-4 p-3.5">
                                                    <Link href={`/profile/${like.fromUserId || like.id}?source=new-match`} className="flex items-center gap-4 flex-1 min-w-0">
                                                        <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/10 shadow-sm">
                                                            <SafeImage
                                                                src={like.photoURL || '/placeholder.svg'}
                                                                alt={like.displayName || 'Perfil'}
                                                                fill
                                                                sizes="56px"
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <p className="font-bold truncate text-sm">{like.displayName || 'Alora User'}</p>
                                                                {like.type === 'superlike' && (
                                                                    <Badge className="bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[8px] font-black uppercase px-1.5 h-4 border-none">
                                                                        Flechado
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-[11px] text-muted-foreground font-medium truncate">
                                                                {like.intent === 'friendship' ? 'Interés en amistad' : 'Quiere conocerte'} • Ver perfil
                                                            </p>
                                                        </div>
                                                    </Link>
                                                    <div className="flex gap-2 shrink-0">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-10 w-10 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            onClick={(e) => { e.preventDefault(); handleRejectMatch(like); }}
                                                            disabled={processingMatch === like.fromUserId}
                                                            aria-label="Rechazar"
                                                        >
                                                            <X className="h-5 w-5" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            className="h-10 w-10 bg-primary text-primary-foreground rounded-full shadow-glow-sm hover:scale-110 active:scale-95 transition-all"
                                                            onClick={(e) => { e.preventDefault(); handleAcceptMatch(like); }}
                                                            disabled={processingMatch === like.fromUserId}
                                                            aria-label="Aceptar"
                                                        >
                                                            {processingMatch === like.fromUserId ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <MessageSquare className="h-5 w-5" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-xl">¿Rechazar conexión?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            No volverás a ver este perfil. Esta acción es definitiva para mantener la calidad de tu comunidad.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => setRejectTarget(null)} className="rounded-full font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRejectMatch} className="bg-destructive text-white hover:bg-destructive/90 rounded-full font-bold">
                            Rechazar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-none glass">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-headline text-xl">¿Eliminar conversación?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Se ocultará de tu lista. Los mensajes no se borran del servidor por seguridad, pero no podrás acceder a ellos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel onClick={() => setHideTargetId(null)} className="rounded-full font-bold">Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmHideConversation} className="bg-destructive text-white hover:bg-destructive/90 rounded-full font-bold">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
