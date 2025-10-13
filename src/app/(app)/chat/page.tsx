

"use client";

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { mockChats, type ChatConversation, mockProfiles, type UserProfile } from '@/lib/mock-data';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, Search, Trash2, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import placeholderImages from '@/lib/placeholder-images.json';
import { getRejectedProfilesFromStorage, saveRejectedProfilesToStorage } from '@/lib/storage';


function Timestamp({ dateString }: { dateString: string }) {
  const [formattedTime, setFormattedTime] = useState('');

  useEffect(() => {
    // This runs only on the client, after hydration
    const date = new Date(dateString);
    setFormattedTime(date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [dateString]);

  return <>{formattedTime}</>;
}


export default function ChatListPage() {
  const [chats, setChats] = useState<ChatConversation[]>(mockChats);
  const [newMatches, setNewMatches] = useState(() => mockProfiles.filter(p => ['5', '6'].includes(p.id)));
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const handleLikeBack = (matchId: string) => {
    const matchProfile = newMatches.find(p => p.id === matchId);
    if (!matchProfile) return;

    // Remove from new matches
    setNewMatches(prev => prev.filter(m => m.id !== matchId));

    // Add to conversations
    const newChat: ChatConversation = {
      id: matchProfile.id,
      participant: matchProfile,
      messages: [
        {
          id: crypto.randomUUID(),
          sender: 'me',
          text: `¡Hola! Gracias por el match. 😊`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setChats(prev => [newChat, ...prev]);

    toast({
        title: `¡Nuevo match! 🎉`,
        description: `Ahora puedes chatear con ${matchProfile.name}.`
    });
  }
  
  const handleDeclineMatch = (matchId: string) => {
    const rejectedProfile = newMatches.find(p => p.id === matchId);
    if (!rejectedProfile) return;

    // Add to rejected list in localStorage
    const currentRejected = getRejectedProfilesFromStorage();
    if (!currentRejected.some(p => p.id === rejectedProfile.id)) {
        saveRejectedProfilesToStorage([...currentRejected, rejectedProfile]);
    }
    
    // Remove from new matches UI
    setNewMatches(prev => prev.filter(m => m.id !== matchId));

     toast({
        variant: "destructive",
        title: "Match rechazado",
        description: `${rejectedProfile.name} ha sido movido a tus perfiles ocultos.`,
    });
  }


  const handleDeleteChat = (chatId: string) => {
    setChats(chats.filter(c => c.id !== chatId));
    toast({
        title: "Conversación eliminada",
    })
  }

  const filteredChats = chats.filter(chat => 
    chat.participant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="md:pl-60">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Conexiones</h1>
      </header>
      <main>
        <Tabs defaultValue="conversations" className="w-full">
            <TabsList className="w-full justify-start rounded-none bg-transparent border-b px-4 gap-4">
                <TabsTrigger value="conversations" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent data-[state=active]:text-primary px-1">Conversaciones</TabsTrigger>
                <TabsTrigger value="new-matches" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none shadow-none bg-transparent data-[state=active]:text-primary px-1 relative">
                    Nuevos Matches
                    {newMatches.length > 0 && <span className="absolute -top-1 -right-3 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{newMatches.length}</span>}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="conversations" className="p-4">
                 <div className="relative mb-4">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar chats" 
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        />
                </div>
                <div className="space-y-1">
                {filteredChats.map((chat) => (
                    <div key={chat.id} className="group flex items-center rounded-lg hover:bg-secondary">
                        <Link href={`/chat/${chat.id}`} className="flex-grow">
                        <div className="flex items-center gap-4 p-3 transition-colors">
                            <Avatar className="h-12 w-12 border-2 border-primary/50">
                            <AvatarImage src={chat.participant.photos[0]} alt={chat.participant.name} data-ai-hint="person"/>
                            <AvatarFallback>{chat.participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{chat.participant.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                                {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "No hay mensajes aún."}
                            </p>
                            </div>
                            <span className="text-xs text-muted-foreground self-start mt-1">
                            {chat.messages.length > 0 ? <Timestamp dateString={chat.messages[chat.messages.length - 1].timestamp} /> : ''}
                            </span>
                        </div>
                        </Link>
                        <div className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-destructive focus:text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Eliminar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                ))}
                {filteredChats.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">
                                {searchTerm ? "No se encontraron chats." : "No tienes conversaciones aún."}
                            </p>
                        </div>
                )}
                </div>
            </TabsContent>
            <TabsContent value="new-matches" className="p-4">
                 <h2 className="text-lg font-semibold mb-2">Les has gustado</h2>
                 <p className="text-muted-foreground text-sm mb-4">¡Aquí tienes a tus admiradoras! Corresponde para hacer match.</p>
                 {newMatches.length > 0 ? (
                    <ScrollArea>
                        <div className="flex space-x-4 pb-4">
                            {newMatches.map(match => (
                                <div key={match.id} className="w-36 flex-shrink-0 text-center">
                                     <Link href={`/profile/${match.id}?source=new-match`}>
                                        <Avatar className="w-32 h-32 mx-auto border-4 border-primary/40">
                                            <AvatarImage src={match.photos[0]} alt={match.name} data-ai-hint="person" />
                                            <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                     </Link>
                                    <p className="font-semibold mt-2 truncate">{match.name}</p>
                                    <div className="flex justify-center gap-2 mt-2">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button size="icon" variant="outline" className="rounded-full w-10 h-10 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeclineMatch(match.id)}>
                                                        <X className="h-5 w-5"/>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Pasar</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                         <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button size="icon" className="rounded-full w-10 h-10 bg-primary" onClick={() => handleLikeBack(match.id)}>
                                                        <Check className="h-5 w-5"/>
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Match</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <ScrollBar orientation="horizontal"/>
                    </ScrollArea>
                 ) : (
                    <div className="text-center py-10">
                        <p className="text-muted-foreground">Nadie nuevo por aquí. ¡Sigue explorando!</p>
                    </div>
                 )}
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
