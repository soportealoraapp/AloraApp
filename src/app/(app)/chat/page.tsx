"use client";

import { useState } from "react";
import { useMatches } from "@/hooks/use-matches";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Heart, X, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
    const { user } = useAuth();
    const { matches, newMatches, loading, sendLike, refresh } = useMatches();
    const [searchTerm, setSearchTerm] = useState("");
    const { toast } = useToast();
    const [processingMatch, setProcessingMatch] = useState<string | null>(null);

    const filteredMatches = matches.filter((match) => {
        const otherUserId = match.users.find(uid => uid !== user?.uid);
        // TODO: Filter by name when we have profile data
        return true;
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
        // TODO: Implement reject logic (add to hidden list)
        refresh();
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
                            Nuevos Matches ({newMatches.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="conversations" className="space-y-2 mt-4">
                        {filteredMatches.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center mb-2">
                                        Aún no tienes conversaciones
                                    </p>
                                    <p className="text-sm text-muted-foreground text-center">
                                        Empieza a dar likes en la sección Descubrir
                                    </p>
                                    <Button asChild className="mt-4">
                                        <Link href="/discover">Ir a Descubrir</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            filteredMatches.map((match) => {
                                const otherUserId = match.users.find(uid => uid !== user?.uid);
                                return (
                                    <Link key={match.id} href={`/chat/${match.id}`}>
                                        <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                            <CardContent className="flex items-center gap-4 p-4">
                                                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                                                    <Image
                                                        src="/placeholder.jpg"
                                                        alt="Profile"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-semibold truncate">Usuario #{otherUserId?.slice(0, 8)}</p>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {match.compatibility}% compatible
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate">
                                                        Haz click para chatear
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="space-y-2 mt-4">
                        {newMatches.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground text-center">
                                        No tienes nuevos matches por el momento
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            newMatches.map((like) => (
                                <Card key={like.id}>
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <Link href={`/profile/${like.fromUserId}?source=new-match`} className="flex items-center gap-4 flex-1">
                                            <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                                                <Image
                                                    src="/placeholder.jpg"
                                                    alt="Profile"
                                                    fill
                                                    className="object-cover"
                                                />
                                                {like.type === 'superlike' && (
                                                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/50 to-violet-500/50" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold truncate">Usuario #{like.fromUserId.slice(0, 8)}</p>
                                                    {like.type === 'superlike' && (
                                                        <Badge className="bg-gradient-to-r from-pink-500 to-violet-500 text-white">
                                                            Super Like
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Le gustaste • Toca para ver perfil
                                                </p>
                                            </div>
                                        </Link>
                                        <div className="flex gap-2">
                                            <Button
                                                size="icon"
                                                variant="outline"
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
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    handleAcceptMatch(like);
                                                }}
                                                disabled={processingMatch === like.fromUserId}
                                            >
                                                {processingMatch === like.fromUserId ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <CheckCircle className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
