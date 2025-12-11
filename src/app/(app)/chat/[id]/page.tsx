"use client";

import { useEffect, useRef } from "react";
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
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatWindowPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const matchId = params.id as string;
    const { messages, loading, sending, sendMessage, markAsRead } = useChat(matchId);
    const { matches } = useMatches();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const match = matches.find((m) => m.id === matchId);
    const otherUserId = match?.users.find((uid) => uid !== user?.uid);

    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            markAsRead();
        }
    }, [messages, markAsRead]);

    const handleSendMessage = async (text: string) => {
        if (!otherUserId) return;
        await sendMessage(text, otherUserId);
    };

    const handleUnmatch = () => {
        toast({
            title: "Match deshecho",
            description: "Ya no aparecerá en tus conversaciones",
        });
        router.push("/chat");
    };

    const handleReport = () => {
        toast({
            title: "Reporte enviado",
            description: "Revisaremos tu reporte pronto",
        });
    };

    if (loading && messages.length === 0) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                </header>
                <main className="flex flex-col h-[calc(100vh-4rem)] p-4">
                    <div className="flex-1 space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-16 w-3/4" />
                        ))}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="md:pl-60 flex flex-col h-screen">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>

                <Link href={`/profile/${otherUserId}`} className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col">
                        <span className="font-semibold">
                            Usuario #{otherUserId?.slice(0, 8)}
                        </span>
                        {match && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
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
                        <DropdownMenuItem onClick={handleUnmatch} className="text-destructive">
                            Deshacer match
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="bg-primary/10 rounded-full p-6 mb-4">
                            <Sparkles className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">¡Es un match!</h3>
                        <p className="text-muted-foreground mb-4">
                            Empieza la conversación con un mensaje amigable
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isOwnMessage = message.senderId === user?.uid;

                            return (
                                <div
                                    key={message.id}
                                    className={cn(
                                        "flex",
                                        isOwnMessage ? "justify-end" : "justify-start"
                                    )}
                                >
                                    <Card
                                        className={cn(
                                            "max-w-[70%] px-4 py-2",
                                            isOwnMessage
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary"
                                        )}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">
                                            {message.text}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-xs mt-1",
                                                isOwnMessage
                                                    ? "text-primary-foreground/70"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {new Date(message.createdAt).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </Card>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
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
        </div>
    );
}
