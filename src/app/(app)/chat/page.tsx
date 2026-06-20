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
import { Search, Heart, X, CheckCircle, Loader2, MessageSquare, EyeOff, Bell, BellOff, Trash2, MoreVertical } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from 'next/dynamic';
const LikesReceivedList = dynamic(() => import("@/components/match/LikesReceivedList").then(m => m.LikesReceivedList), { ssr: false });
import { BRAND_VOICE } from "@/lib/constants/brand-voice";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    const [rejectTarget, setRejectTarget] = useState<any>(null);
    const [hideDialogOpen, setHideDialogOpen] = useState(false);
    const [hideTargetId, setHideTargetId] = useState<string | null>(null);

    const filteredMatches = matches.filter((match) => {
        // hiddenMatches are already filtered server-side via hiddenBy field
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
    });

    const staleMatches = matches.filter((match) => {
        const lastMsg = match.lastMessage?.createdAt;
        if (!lastMsg) return false;
        const hours = (Date.now() - new Date(lastMsg).getTime()) / (1000 * 60 * 60);
        return hours >= 72;
    });

    const recentStaleMatches = matches.filter((match) => {
        // hiddenMatches are already filtered server-side via hiddenBy field
        const lastMsg = match.lastMessage?.createdAt;
        if (!lastMsg) return false;
        const hours = (Date.now() - new Date(lastMsg).getTime()) / (1000 * 60 * 60);
        return hours >= 72 && hours <= 168;
    });

    const handleAcceptMatch = async (like: any) => {
        setProcessingMatch(like.fromUserId);
        try {
            await sendLike(like.fromUserId, 'like', like.intent || 'dating', false);
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

            // Refresh matches to reflect server-side hiddenBy filter
            refresh();

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

    if (loading) {
        return (
            <div>
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
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
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
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

                {recentStaleMatches.length > 0 && !showStaleOnly && !dismissedStaleBanner && (
                    <div className="rounded-2xl border bg-muted/30 p-4 flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground font-medium">
                            Hay conversaciones esperando una respuesta
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs whitespace-nowrap"
                                onClick={() => setShowStaleOnly(true)}
                            >
                                Ver inactivas
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDismissedStaleBanner(true)}
                                aria-label="Cerrar"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}

                {showStaleOnly && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando conversaciones inactivas ({staleMatches.length})
                        </p>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() => setShowStaleOnly(false)}
                        >
                            Ver todas
                        </Button>
                    </div>
                )}

                <Tabs defaultValue="conversations" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="conversations">
                            Conversaciones ({matches.length})
                        </TabsTrigger>
                        <TabsTrigger value="new">
                            Nuevos
                            {newMatches.length > 0 && (
                                <Badge variant="default" className="ml-2 rounded-full h-5 w-5 flex items-center justify-center p-0 text-xs">
                                    {newMatches.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-3 mt-4">
                        {filteredMatches.length === 0 ? (
                            <Card className="rounded-2xl border bg-muted/20">
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
                                        const isMuted = match.mutedUntil && match.mutedByUserId === user?.id ? new Date(match.mutedUntil) > new Date() : false;

                                        return (
                                            <motion.div
                                                key={match.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05, type: "spring", stiffness: 180, damping: 35 }}
                                                className="relative overflow-hidden rounded-2xl"
                                            >
                                                {/* Action buttons revealed behind the card */}
                                                <div className="absolute inset-0 flex items-center justify-end gap-1.5 pr-2 bg-muted/20 z-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleMuteConversation(match.id, isMuted);
                                                        }}
                                                        className={cn(
                                                            "h-[calc(100%-8px)] rounded-xl flex flex-col items-center justify-center px-4 transition-all text-white border-none shadow-sm",
                                                            isMuted ? "bg-amber-500 dark:bg-amber-600 hover:bg-amber-600 dark:hover:bg-amber-700" : "bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
                                                        )}
                                                    >
                                                        {isMuted ? <Bell className="h-4 w-4 mb-0.5" /> : <BellOff className="h-4 w-4 mb-0.5" />}
                                                        <span className="text-[10px] font-bold">{isMuted ? "Activar" : "Silenciar"}</span>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleHideConversation(match.id);
                                                        }}
                                                        disabled={hidingMatch === match.id}
                                                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl h-[calc(100%-8px)] flex flex-col items-center justify-center px-4 border-none shadow-sm"
                                                    >
                                                        <Trash2 className="h-4 w-4 mb-0.5" />
                                                        <span className="text-[10px] font-bold">Eliminar</span>
                                                    </Button>
                                                </div>

                                                {/* Draggable card container */}
                                                <motion.div
                                                    drag="x"
                                                    dragDirectionLock
                                                    dragConstraints={{ left: -160, right: 0 }}
                                                    dragElastic={{ left: 0.1, right: 0 }}
                                                    className="relative z-10 bg-background"
                                                >
                                                    <Link href={`/chat/${match.id}`} className="block">
                                                        <Card className="rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-[0.98]">
                                                            <CardContent className="flex items-center gap-4 p-4">
                                                                <div className="relative h-16 w-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-muted">
                                                                    <Image
                                                                        src={partnerPhoto}
                                                                        alt={partnerName}
                                                                        fill
                                                                        className="object-cover"
                                                                        loading="lazy"
                                                                    />
                                                                    {isMuted && (
                                                                        <div className="absolute top-0 right-0 bg-amber-500 text-white rounded-full p-0.5 shadow-sm border border-background">
                                                                            <BellOff className="h-3 w-3" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between mb-1">
                                                                        <p className="font-bold text-foreground truncate">{partnerName}</p>
                                                                        {match.lastMessage?.createdAt && (() => {
                                                                            const hours = (Date.now() - new Date(match.lastMessage.createdAt).getTime()) / (1000 * 60 * 60);
                                                                            if (hours >= 72) {
                                                                                return (
                                                                                    <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                                                                        Esperando respuesta
                                                                                    </Badge>
                                                                                );
                                                                            }
                                                                            return null;
                                                                        })()}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground truncate italic">
                                                                        {match.lastMessage?.content || (match.intent === 'friendship' ? '¡Nueva amistad!' : `¡Es un match! ${BRAND_VOICE.nudges.newMatch}`)}
                                                                    </p>
                                                                    {match.lastMessage?.createdAt && (() => {
                                                                        const hours = (Date.now() - new Date(match.lastMessage.createdAt).getTime()) / (1000 * 60 * 60);
                                                                        if (hours > 72) {
                                                                            return (
                                                                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                                                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
                                                                                    Sin respuesta por {Math.round(hours / 24)} día(s)
                                                                                </p>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                </div>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 shrink-0 z-20"
                                                                            onClick={(e) => e.preventDefault()}
                                                                            aria-label="Opciones de conversación"
                                                                        >
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => handleMuteConversation(match.id, isMuted)}>
                                                                            {isMuted ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
                                                                            {isMuted ? "Activar notificaciones" : "Silenciar"}
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => handleHideConversation(match.id)} className="text-destructive">
                                                                            <Trash2 className="h-4 w-4 mr-2" />
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
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold truncate">{like.displayName || `Usuario #${(like.fromUserId || like.id).slice(0, 8)}`}</p>
                                                             {like.type === 'superlike' && (
                                                                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                                                                       Flechado
                                                                  </Badge>
                                                              )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {like.intent === 'friendship' ? 'Amistad mutua' : 'Match mutuo'} • Chatea ahora
                                                        </p>
                                                    </div>
                                                </Link>
                                                <div className="flex gap-2">
                                                     <Button
                                                         size="icon"
                                                         variant="ghost"
                                                         className="text-muted-foreground hover:text-destructive"
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
                                                         className="bg-primary text-primary-foreground rounded-full"
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

            <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Rechazar match?</AlertDialogTitle>
                        <AlertDialogDescription>
                            No volverás a ver este perfil. Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setRejectTarget(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRejectMatch} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Rechazar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={hideDialogOpen} onOpenChange={setHideDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar conversación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta conversación se ocultará de tu lista. No se eliminarán los mensajes del servidor, pero no podrás verla más.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setHideTargetId(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmHideConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
