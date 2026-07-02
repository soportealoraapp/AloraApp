"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/use-matches";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MoreVertical, Sparkles, Loader2, Circle, History } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { VoiceMessage } from "@/components/chat/VoiceMessage";
import { MuteDialog } from "@/components/chat/MuteDialog";
import { ConversationRoulette } from "@/components/chat/ConversationRoulette";
import { MatchTimeline } from "@/components/chat/MatchTimeline";
import { MatchFeedbackDialog } from "@/components/match/MatchFeedbackDialog";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalytics, AnalyticsEvents } from "@/hooks/use-analytics";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

import { MessageBubble } from "@/components/chat/message-bubble";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { BlockDialog } from "@/components/safety/BlockDialog";
import Image from "next/image";

export default function ChatWindowPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const matchId = params.id as string;
    const { messages, setMessages, loading, sending, sendMessage, emitTyping, markAsRead, loadMore, hasMore, loadingMore, isPartnerOnline, partnerTyping } = useChat(matchId);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = () => {
            // Primary: visualViewport API (works in modern browsers)
            if (window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                const windowHeight = window.innerHeight;
                const heightDiff = windowHeight - viewportHeight;
                if (heightDiff > 50) {
                    setKeyboardHeight(heightDiff);
                    return;
                }
            }
            // Fallback: compare innerHeight to initial height (for older WebView)
            if (!initialHeightRef.current) {
                initialHeightRef.current = window.innerHeight;
            }
            const heightDiff = initialHeightRef.current - window.innerHeight;
            setKeyboardHeight(heightDiff > 100 ? heightDiff : 0);
        };

        window.visualViewport?.addEventListener('resize', handleResize);
        window.visualViewport?.addEventListener('scroll', handleResize);
        window.addEventListener('resize', handleResize);
        return () => {
            window.visualViewport?.removeEventListener('resize', handleResize);
            window.visualViewport?.removeEventListener('scroll', handleResize);
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const initialHeightRef = useRef<number | null>(null);
    const { matches } = useMatches();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
    const [showIcebreakers, setShowIcebreakers] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);
    const [showMuteDialog, setShowMuteDialog] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
    const [matchHealth, setMatchHealth] = useState(0);
    const [partnerAnswer, setPartnerAnswer] = useState<{ question: string; answer: string } | null>(null);

    const match = matches.find((m) => m.id === matchId);
    const otherUserId = match?.users.find((id) => id !== user?.id);
    const partner = match?.partner;
    const partnerName = partner?.displayName || `Usuario #${otherUserId?.slice(0, 8)}`;
    const partnerPhoto = partner?.photoURL || '/placeholder.svg';

    const isMuted = useMemo(() => {
        if (!match?.mutedUntil || match.mutedByUserId !== user?.id) return false;
        return new Date(match.mutedUntil) > new Date();
    }, [match?.mutedUntil, match?.mutedByUserId, user?.id]);

    useEffect(() => {
        if (!matchId) return;
        // Parallelize independent fetch calls for faster initial load
        Promise.allSettled([
            fetch(`/api/chat/health?matchId=${matchId}`).then(r => r.json()),
            otherUserId ? fetch(`/api/profile/${otherUserId}`).then(r => r.json()) : Promise.resolve(null),
        ]).then(([healthResult, profileResult]) => {
            if (healthResult.status === 'fulfilled') {
                setMatchHealth(healthResult.value.score || 0);
            }
            if (profileResult.status === 'fulfilled' && profileResult.value?.latestAnswer?.question && profileResult.value?.latestAnswer?.answer) {
                setPartnerAnswer({
                    question: profileResult.value.latestAnswer.question,
                    answer: profileResult.value.latestAnswer.answer,
                });
            }
        }).catch(() => {});

        // Match feedback check (delayed)
        const checkFeedback = async () => {
            try {
                const res = await fetch(`/api/match/feedback?matchId=${matchId}`);
                if (!res.ok) return;
                const data = await res.json();
                if (data?.showPrompt) {
                    setShowFeedbackDialog(true);
                }
            } catch {}
        };
        const timer = setTimeout(checkFeedback, 1500);
        return () => clearTimeout(timer);
    }, [matchId, otherUserId]);

    const [autoScroll, setAutoScroll] = useState(true);
    const { track } = useAnalytics();
    const messageCountRef = useRef(0);
    const icebreakersFetchedRef = useRef(false);

    // Auto-scroll to bottom on new messages (if user is near bottom)
    useEffect(() => {
        if (autoScroll && messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages.length, autoScroll]);

    // Auto-fetch icebreakers on empty or short conversation
    useEffect(() => {
        if (!loading && !icebreakersFetchedRef.current && messages.length <= 2 && messages.length >= 0) {
            icebreakersFetchedRef.current = true;
            fetchIcebreakers();
        }
    }, [loading, messages.length]);

    // Mark messages as read when component mounts
    useEffect(() => {
        if (messages.length > 0) {
            const timer = setTimeout(() => markAsRead(), 1000);
            return () => clearTimeout(timer);
        }
    }, [matchId, markAsRead, messages.length]);

    // Track scroll position for auto-scroll
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        setAutoScroll(scrollHeight - scrollTop - clientHeight < 100);

        // Load more when scrolled to top
        if (scrollTop < 50 && hasMore && !loadingMore) {
            loadMore();
        }
    }, [hasMore, loadingMore, loadMore]);

    // Group messages by date for date separators
    const groupedMessages = useMemo(() => {
        const groups: { date: string; messages: typeof messages }[] = [];
        let currentDate = '';
        let currentGroup: typeof messages = [];

        for (const msg of messages) {
            const msgDate = new Date(msg.createdAt).toLocaleDateString();
            if (msgDate !== currentDate) {
                if (currentGroup.length > 0) {
                    groups.push({ date: currentDate, messages: currentGroup });
                }
                currentDate = msgDate;
                currentGroup = [msg];
            } else {
                currentGroup.push(msg);
            }
        }
        if (currentGroup.length > 0) {
            groups.push({ date: currentDate, messages: currentGroup });
        }
        return groups;
    }, [messages]);

    const getDateLabel = (dateStr: string) => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        if (dateStr === today) return 'Hoy';
        if (dateStr === yesterday) return 'Ayer';
        return dateStr;
    };

    const fetchIcebreakers = async () => {
        if (!matchId || !otherUserId) return;
        setLoadingIcebreakers(true);
        try {
            const response = await fetch('/api/ai/icebreakers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId })
            });
            
            if (!response.ok) {
                // If AI fails (like GEMINI_API_KEY missing), don't show error to user
                // just fail silently and don't show the icebreakers section
                console.warn('Icebreakers AI failed, likely missing API Key');
                return;
            }

            const data = await response.json();
            setIcebreakers(data.icebreakers || []);
            setShowIcebreakers(true);
        } catch (error) {
            console.error('Icebreakers fetch error:', error);
        } finally {
            setLoadingIcebreakers(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!otherUserId) return;
        try {
            await sendMessage(text, otherUserId);

            track(AnalyticsEvents.FIRST_MESSAGE, { matchId, partnerId: otherUserId });

            const newCount = messageCountRef.current + 1;
            messageCountRef.current = newCount;
            if (newCount === 10 || newCount === 25 || newCount === 50) {
                track(AnalyticsEvents.CONVERSATION_MILESTONE, { matchId, count: newCount });
            }
        } catch (error: any) {
            if (error?.code === 'first_message_restriction') {
                toast({
                    title: "Ella da el primer paso",
                    description: "En conexiones entre hombres y mujeres, ella envía el primer mensaje. Espera a que inicie la conversación.",
                    variant: "default"
                });
            } else {
                toast({
                    title: "Error",
                    description: "No se pudo enviar el mensaje. Intenta de nuevo.",
                    variant: "destructive"
                });
            }
        }
    };

    const handleSendImage = async (imageUrl: string) => {
        if (!otherUserId || !user) return;
        const optimisticId = crypto.randomUUID();
        const optimisticMsg: any = {
            id: optimisticId,
            matchId,
            senderId: user.id,
            content: imageUrl,
            type: 'image',
            createdAt: new Date().toISOString(),
            status: 'pending',
        };
        setMessages(prev => [...prev, optimisticMsg]);
        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    receiverId: otherUserId,
                    text: imageUrl,
                    type: 'image',
                    clientMessageId: optimisticId,
                }),
            });
            if (!response.ok) throw new Error('Failed to send image');
            const data = await response.json();
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...data, createdAt: new Date(data.created_at || data.createdAt) } : m));
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            toast({
                title: "Error",
                description: "No se pudo enviar la imagen.",
                variant: "destructive"
            });
        }
    };

    const handleSendVoice = async (audioUrl: string, duration: number) => {
        if (!otherUserId || !user) return;
        const optimisticId = crypto.randomUUID();
        const optimisticMsg: any = {
            id: optimisticId,
            matchId,
            senderId: user.id,
            content: JSON.stringify({ audioUrl, duration }),
            type: 'voice',
            createdAt: new Date().toISOString(),
            status: 'pending',
        };
        setMessages(prev => [...prev, optimisticMsg]);
        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    receiverId: otherUserId,
                    text: JSON.stringify({ audioUrl, duration }),
                    type: 'voice',
                    clientMessageId: optimisticId,
                }),
            });
            if (!response.ok) throw new Error('Failed to send voice message');
            const data = await response.json();
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...data, createdAt: new Date(data.created_at || data.createdAt) } : m));
        } catch (error) {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
            toast({
                title: "Error",
                description: "No se pudo enviar el mensaje de voz.",
                variant: "destructive"
            });
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const response = await fetch('/api/chat/react', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId, emoji }),
            });
            if (!response.ok) throw new Error('Failed to react');
            const data = await response.json();
            setMessages(prev =>
                prev.map(m =>
                    m.id === messageId ? { ...m, reactions: data.reactions } : m
                )
            );
        } catch (error) {
            console.error('Error reacting:', error);
        }
    };

    const handleRetry = useCallback(async (failedMessage: any) => {
        if (!otherUserId || !user) return;
        const retryId = failedMessage.id;
        setMessages(prev => prev.map(m => m.id === retryId ? { ...m, status: 'pending' } : m));
        try {
            const response = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    matchId,
                    receiverId: otherUserId,
                    text: failedMessage.content,
                    type: failedMessage.type || 'text',
                    clientMessageId: retryId,
                }),
            });
            if (!response.ok) throw new Error('Retry failed');
            const data = await response.json();
            setMessages(prev => prev.map(m => m.id === retryId ? { ...data, createdAt: new Date(data.created_at || data.createdAt) } : m));
        } catch {
            setMessages(prev => prev.map(m => m.id === retryId ? { ...m, status: 'failed' } : m));
            toast({ title: 'Error', description: 'No se pudo reenviar el mensaje.', variant: 'destructive' });
        }
    }, [otherUserId, user, matchId, setMessages, toast]);

    const handleMute = async (duration: number | null) => {
        try {
            const response = await fetch('/api/chat/mute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, duration }),
            });
            if (!response.ok) throw new Error('Failed to mute');
            toast({
                title: duration === -1 ? 'Notificaciones activadas' : 'Conversación silenciada',
                description: duration === -1
                    ? 'Recibirás notificaciones de nuevos mensajes'
                    : 'No recibirás notificaciones de esta conversación',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cambiar el silencio',
                variant: 'destructive',
            });
        }
    };

    function handleReport() {
        setShowReportDialog(true);
    }

    if (loading && messages.length === 0) {
        return (
            <div className="flex flex-col" style={{ height: '100dvh' }}>
                <header className="flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0 pt-safe">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </header>
                <main className="flex-1 space-y-4 p-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                            <Skeleton className="h-16 w-3/4 rounded-2xl" />
                        </div>
                    ))}
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ height: keyboardHeight > 0 ? `calc(100dvh - ${keyboardHeight}px)` : '100dvh' }}>
            {/* Header with avatar */}
            <header className="flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0 z-20 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Link href={otherUserId ? `/profile/${otherUserId}` : '#'} className={`flex items-center gap-3 flex-1 overflow-hidden ${!otherUserId ? 'pointer-events-none' : ''}`}>
                    <div className="relative h-10 w-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-muted">
                        <Image src={partnerPhoto} alt={partnerName} fill sizes="40px" className="object-cover" loading="lazy" />
                        {isPartnerOnline && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                        )}
                    </div>
                    <div className="flex flex-col truncate">
                        <span className="font-semibold truncate flex items-center gap-2">
                            {partnerName}
                            {partnerTyping && (
                                <span className="text-xs text-muted-foreground animate-pulse font-normal">
                                    escribiendo...
                                </span>
                            )}
                        </span>
                        {!partnerTyping && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {isPartnerOnline ? (
                                    <span className="flex items-center gap-1">
                                        <Circle className="h-2 w-2 fill-primary text-primary" />
                                        En línea
                                    </span>
                                ) : (
                                    <Sparkles className="h-3 w-3 text-primary" />
                                )}
                                {match?.score != null && match.score > 0 && !isPartnerOnline && (
                                    <>{Math.round(match.score)}% compatible</>
                                )}
                                {matchHealth > 0 && (
                                    <span className={cn(
                                        "ml-1",
                                        matchHealth >= 80 ? "text-primary" :
                                        matchHealth >= 60 ? "text-muted-foreground" :
                                        matchHealth >= 40 ? "text-muted-foreground" :
                                        "text-destructive"
                                    )}>
                                        {matchHealth >= 80 ? "Excelente" :
                                         matchHealth >= 60 ? "Buena" :
                                         matchHealth >= 40 ? "Temprana" :
                                         "Necesita interacción"}
                                    </span>
                                )}
                            </span>
                        )}
                    </div>
                </Link>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowTimeline(true)}
                    title="Línea de tiempo"
                >
                    <History className="h-5 w-5" />
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {otherUserId && (
                            <DropdownMenuItem asChild>
                                <Link href={`/profile/${otherUserId}`}>Ver perfil</Link>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setShowTimeline(true)}>
                            <History className="h-4 w-4 mr-2" /> Línea de tiempo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowMuteDialog(true)}>
                            Silenciar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleReport}>
                            Reportar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowBlockDialog(true)} className="text-destructive">
                            Bloquear y deshacer match
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Messages area */}
            <main
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 pb-safe space-y-1 touch-pan-y overscroll-contain relative"
            >
                {partnerAnswer && (
                    <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 mb-4 mx-auto max-w-sm">
                        <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Su respuesta del día</p>
                        <p className="text-xs text-muted-foreground mb-2 italic">&ldquo;{partnerAnswer.question}&rdquo;</p>
                        <p className="text-sm font-medium text-foreground leading-relaxed">&ldquo;{partnerAnswer.answer}&rdquo;</p>
                    </div>
                )}

                {loadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-primary/10 rounded-full p-6 mb-4">
                            <Sparkles className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">¡Es un match!</h3>
                        <p className="text-muted-foreground mb-2 max-w-xs">
                            Empieza la conversación con algo especial. Tu mensaje puede ser el inicio de algo increíble.
                        </p>
                        <p className="text-xs text-muted-foreground/80 mb-4 max-w-xs">
                            En Alora, ella da el primer paso. Esto crea un espacio más seguro y cómodo para todas.
                        </p>
                        <Button
                            onClick={fetchIcebreakers}
                            disabled={loadingIcebreakers}
                            className="rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                        >
                            {loadingIcebreakers ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Sugerir rompehielos
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {groupedMessages.map((group) => (
                            <div key={group.date}>
                                <div className="flex justify-center my-4">
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                                        {getDateLabel(group.date)}
                                    </span>
                                </div>
                                {group.messages.map((message) => {
                                    const isMe = message.senderId === user?.id;
                                    const messageElement = (() => {
                                        if (message.type === 'voice') {
                                            try {
                                                const voiceData = typeof message.content === 'string'
                                                    ? JSON.parse(message.content)
                                                    : message.content;
                                                if (voiceData && typeof voiceData === 'object' && voiceData.audioUrl) {
                                                    return (
                                                        <VoiceMessage
                                                            audioUrl={voiceData.audioUrl}
                                                            duration={voiceData.duration}
                                                            isOwn={isMe}
                                                        />
                                                    );
                                                }
                                                return (
                                                    <MessageBubble
                                                        message={{
                                                            ...message,
                                                            content: typeof message.content === 'string'
                                                                ? message.content
                                                                : JSON.stringify(message.content)
                                                        }}
                                                        isMe={isMe}
                                                        currentUserId={user?.id}
                                                        onReact={handleReact}
                                                        onRetry={handleRetry}
                                                    />
                                                );
                                            } catch {
                                                return (
                                                    <MessageBubble
                                                        message={{
                                                            ...message,
                                                            content: typeof message.content === 'string'
                                                                ? message.content
                                                                : JSON.stringify(message.content)
                                                        }}
                                                        isMe={isMe}
                                                        currentUserId={user?.id}
                                                        onReact={handleReact}
                                                        onRetry={handleRetry}
                                                    />
                                                );
                                            }
                                        }
                                        return (
                                            <MessageBubble
                                                message={{
                                                    ...message,
                                                    content: typeof message.content === 'string'
                                                        ? message.content
                                                        : JSON.stringify(message.content)
                                                }}
                                                isMe={isMe}
                                                currentUserId={user?.id}
                                                onReact={handleReact}
                                                        onRetry={handleRetry}
                                            />
                                        );
                                    })();

                                    if (isMe) {
                                        return (
                                            <div key={message.id} className="w-full flex justify-end">
                                                {messageElement}
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={message.id} className="w-full flex justify-start items-start gap-2 mb-2">
                                                <Link href={otherUserId ? `/profile/${otherUserId}` : '#'} className="h-11 w-11 rounded-full overflow-hidden shrink-0 relative mt-1 border border-muted hover:opacity-90 transition-opacity">
                                                    <Image src={partnerPhoto} alt={partnerName} fill sizes="44px" className="object-cover" loading="lazy" />
                                                </Link>
                                                <div className="flex-1 min-w-0 max-w-[85%]">
                                                    {messageElement}
                                                </div>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        ))}
                        {/* Partner typing indicator */}
                        <AnimatePresence>
                            {partnerTyping && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="flex items-start gap-2 px-1"
                                >
                                    <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                                        <div className="flex gap-1">
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}

                <AnimatePresence>
                    {showIcebreakers && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute bottom-4 left-4 right-4 z-30"
                        >
                            <Card className="p-4 shadow-2xl border-primary/20 bg-card/95 backdrop-blur-sm rounded-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-primary flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Sugerencias para romper el hielo
                                    </h4>
                                    <Button variant="ghost" size="sm" onClick={() => setShowIcebreakers(false)} className="rounded-full">
                                        Cerrar
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {icebreakers.map((text, i) => (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                handleSendMessage(text);
                                                setShowIcebreakers(false);
                                            }}
                                            className="w-full text-left p-3 text-sm rounded-2xl bg-muted/50 hover:bg-muted transition-colors text-foreground border border-border"
                                        >
                                            {text}
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Chat input area */}
            <div className="border-t bg-background p-4 pb-safe" style={{ paddingBottom: keyboardHeight > 0 ? `calc(${keyboardHeight}px + env(safe-area-inset-bottom, 0px))` : undefined }}>
                {isPartnerOnline && (
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-primary flex items-center gap-1 ml-auto">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            En línea
                        </span>
                    </div>
                )}
                {messages.length === 0 ? (
                    <p className="text-xs text-center text-muted-foreground mb-2">
                        💡 Empieza la conversación con algo amable para romper el hielo.
                    </p>
                ) : null}
                <ConversationRoulette
                    onSend={handleSendMessage}
                    disabled={sending || !otherUserId}
                />
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={loadingIcebreakers}
                                className="shrink-0 h-11 w-11 rounded-full text-primary hover:bg-primary/10 min-h-[44px] min-w-[44px]"
                                title="Sugerir rompehielos"
                            >
                                {loadingIcebreakers ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64">
                            <div className="p-3 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                    <h4 className="font-bold text-xs uppercase tracking-widest">Sugerencias para romper el hielo</h4>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-tight">
                                    ¿No sabes qué decir? Prueba con estas ideas personalizadas basadas en sus intereses y valores.
                                </p>
                                <div className="space-y-2">
                                    {loadingIcebreakers ? (
                                        <div className="flex justify-center py-4">
                                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                        </div>
                                    ) : icebreakers.length > 0 ? (
                                        icebreakers.map((text, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    handleSendMessage(text);
                                                }}
                                                className="w-full text-left p-2.5 rounded-xl border border-primary/10 hover:border-primary/40 hover:bg-primary/5 transition-all text-xs leading-snug"
                                            >
                                                {text}
                                            </button>
                                        ))
                                    ) : (
                                        <Button 
                                            size="sm" 
                                            className="w-full text-[10px]" 
                                            onClick={fetchIcebreakers}
                                        >
                                            Generar ideas
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex-1">
                        <ChatInput
                            onSend={handleSendMessage}
                            onSendImage={handleSendImage}
                            onSendVoice={handleSendVoice}
                            onTyping={emitTyping}
                            disabled={sending || !otherUserId}
                            placeholder="Escribe un mensaje..."
                        />
                    </div>
                </div>
                {sending && (
                    <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        Enviando...
                    </div>
                )}
            </div>

            {otherUserId && (
                <>
                    <ReportDialog
                        isOpen={showReportDialog}
                        onClose={() => setShowReportDialog(false)}
                        reportedId={otherUserId}
                        matchId={matchId}
                    />
                    <BlockDialog
                        isOpen={showBlockDialog}
                        onClose={() => setShowBlockDialog(false)}
                        blockedId={otherUserId}
                        onSuccess={() => router.push('/chat')}
                    />
                    <MuteDialog
                        isOpen={showMuteDialog}
                        onClose={() => setShowMuteDialog(false)}
                        onMute={handleMute}
                        isMuted={isMuted}
                    />
                    <MatchTimeline
                        matchId={matchId}
                        open={showTimeline}
                        onClose={() => setShowTimeline(false)}
                    />
                    <MatchFeedbackDialog
                        matchId={matchId}
                        partnerName={partnerName}
                        open={showFeedbackDialog}
                        onClose={() => setShowFeedbackDialog(false)}
                    />
                </>
            )}
        </div>
    );
}
