import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "@/hooks/use-chat";
import { useAuth } from "@/contexts/AuthContext";
import { useMatches } from "@/hooks/use-matches";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MoreVertical, Sparkles, Loader2 } from "lucide-react";
import { ChatInput } from "@/components/chat/chat-input";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

import { MessageBubble } from "@/components/chat/message-bubble";
import { ReportDialog } from "@/components/safety/ReportDialog";
import { BlockDialog } from "@/components/safety/BlockDialog";

export default function ChatWindowPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const matchId = params.id as string;
    const { messages, loading, sending, sendMessage, markAsRead } = useChat(matchId);
    const { matches } = useMatches();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [icebreakers, setIcebreakers] = useState<string[]>([]);
    const [loadingIcebreakers, setLoadingIcebreakers] = useState(false);
    const [showIcebreakers, setShowIcebreakers] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);
    const [showBlockDialog, setShowBlockDialog] = useState(false);

    const match = matches.find((m) => m.id === matchId);
    const otherUserId = match?.users.find((uid) => uid !== user?.uid);

    useEffect(() => {
        if (messages.length > 0) {
            // Scroll to bottom when messages change
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            markAsRead();
        }
    }, [messages, markAsRead]);

    const fetchIcebreakers = async () => {
        if (!matchId || !otherUserId) return;
        setLoadingIcebreakers(true);
        try {
            const response = await fetch('/api/chat/icebreakers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, otherUserId })
            });
            const data = await response.json();
            setIcebreakers(data.icebreakers || []);
            setShowIcebreakers(true);
        } catch (error) {
            toast({
                title: "Error",
                description: "No pudimos generar sugerencias.",
                variant: "destructive"
            });
        } finally {
            setLoadingIcebreakers(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!otherUserId) return;
        await sendMessage(text, otherUserId);
    };

    const handleUnmatch = () => {
        setShowBlockDialog(true);
    };

    const handleReport = () => {
        setShowReportDialog(true);
    };

    if (loading && messages.length === 0) {
        return (
            <div className="md:pl-60 h-screen flex flex-col">
                <header className="flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0">
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
        <div className="md:pl-60 flex flex-col h-[100dvh]">
            <header className="flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 shrink-0 z-20">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Link href={`/profile/${otherUserId}`} className="flex items-center gap-3 flex-1 overflow-hidden">
                    <div className="flex flex-col truncate">
                        <span className="font-semibold truncate">
                            Usuario #{otherUserId?.slice(0, 8)}
                        </span>
                        {match && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-primary" />
                                {match.compatibility}% compatible
                            </span>
                        )}
                    </div>
                </Link>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <Link href={`/profile/${otherUserId}`}>Ver perfil</Link>
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

            <main className="flex-1 overflow-y-auto p-4 space-y-4 touch-pan-y overscroll-contain relative">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
                        <div className="bg-primary/10 rounded-full p-6 mb-4">
                            <Sparkles className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">¡Es un match!</h3>
                        <p className="text-muted-foreground mb-4">
                            Empieza la conversación con un mensaje amigable
                        </p>
                        <Button
                            onClick={fetchIcebreakers}
                            disabled={loadingIcebreakers}
                            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-400 text-white"
                        >
                            {loadingIcebreakers ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Sugerir rompehielos
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    isMe={message.senderId === user?.uid}
                                />
                            ))}
                        </div>
                        <div ref={messagesEndRef} className="h-4" />
                    </>
                )}

                <AnimatePresence>
                    {showIcebreakers && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="absolute bottom-4 left-4 right-4 z-30"
                        >
                            <Card className="p-4 shadow-2xl border-pink-100 bg-white/95 backdrop-blur-sm rounded-3xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-pink-700 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" /> Ideas para empezar
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
                                            className="w-full text-left p-3 text-sm rounded-2xl bg-pink-50 hover:bg-pink-100 transition-colors text-gray-700 border border-pink-100"
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

            <div className="border-t bg-background p-4">
                {messages.length === 0 && profile?.gender !== 'woman' ? (
                    <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center">
                        <Sparkles className="h-8 w-8 text-primary mb-2" />
                        <p className="font-semibold text-primary">Las mujeres dan el primer paso</p>
                        <p className="text-sm text-muted-foreground">Debes esperar a que ella inicie la conversación.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchIcebreakers}
                                disabled={loadingIcebreakers}
                                className="text-xs text-pink-500 rounded-full h-8 px-3 hover:bg-pink-50"
                            >
                                {loadingIcebreakers ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Sparkles className="mr-1 h-3 w-3" />}
                                Sugerir mensaje
                            </Button>
                        </div>
                        <ChatInput
                            onSend={handleSendMessage}
                            disabled={sending || !otherUserId}
                            placeholder="Escribe un mensaje..."
                        />
                        {sending && (
                            <div className="flex items-center justify-center mt-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                Enviando...
                            </div>
                        )}
                    </>
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
                </>
            )}
        </div>
    );
}
