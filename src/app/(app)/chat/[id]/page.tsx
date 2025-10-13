

"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { ChatConversation } from '@/lib/mock-data';
import { mockChats } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreVertical, Trash2, UserX, Gamepad2, MessageSquareQuote, Dices, FileText, Music, Clapperboard, ShieldAlert, BookHeart, UserCheck } from 'lucide-react';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import type { ChatMessage } from '@/lib/actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet"
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import placeholderImages from '@/lib/placeholder-images.json';


const icebreakers = {
    "Divertidas y Ligeras": [
        "Si pudieras tener cualquier superpoder, ¿cuál sería y por qué?",
        "¿Cuál es el emoji que más te representa ahora mismo?",
        "Si los animales pudieran hablar, ¿cuál sería el más grosero?",
        "¿Cuál es la cosa más rara que has comido por gusto?",
    ],
    "Para Conectar": [
        "¿Qué es algo que te apasione de verdad y de lo que podrías hablar horas?",
        "¿Cuál es el mejor consejo que te han dado?",
        "¿Qué es algo que la gente suele malinterpretar de ti?",
        "Si pudieras cenar con tres personas (vivas o muertas), ¿a quiénes elegirías?",
    ],
    "Sobre Viajes y Aventuras": [
        "¿Cuál es el viaje más memorable que has hecho?",
        "Si tuvieras que mudarte a otro país mañana, ¿a dónde irías?",
        "Playa, montaña o ciudad: ¿qué escapada prefieres para un fin de semana?",
        "¿Cuál es la aventura más espontánea que has vivido?",
    ],
};

const games = [
    { id: "ruleta", title: "Ruleta de Retos", description: "Gira la ruleta para un reto divertido.", icon: Dices, path: "/compatibility/quiz/ruleta" },
    { id: "personalidad", title: "Test de Personalidad", description: "Descubre vuestro estilo de compatibilidad.", icon: FileText, path: "/compatibility/quiz/personalidad" },
    { id: "peliculas", title: "Trivia de Películas", description: "Pon a prueba tus conocimientos de cine.", icon: Clapperboard, path: "/compatibility/quiz/peliculas" },
    { id: "musica", title: "Época de Música", description: "Encuentra vuestro gusto musical.", icon: Music, path: "/compatibility/quiz/musica" },
];

const communityGuidelines = [
    { title: "Sé Sincera", text: "Comunica con honestidad lo que buscas y sientes. La autenticidad es la base de cualquier conexión real." },
    { title: "Sé Amable", text: "Trata a los demás como te gustaría que te trataran a ti. Un poco de amabilidad puede marcar una gran diferencia." },
    { title: "Sé Respetuosa", text: "Todas las personas merecen respeto. No uses lenguaje ofensivo, insultos ni hagas comentarios despectivos." },
    { title: "Comunica tus Límites", text: "Si algo te incomoda, dilo. Si alguien te dice que no, respeta su decisión. El consentimiento es fundamental." },
];


export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { id } = params;

  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isIcebreakerSheetOpen, setIsIcebreakerSheetOpen] = useState(false);
  const [isGameSheetOpen, setIsGameSheetOpen] = useState(false);
  const [isGuideSheetOpen, setIsGuideSheetOpen] = useState(false);
  const [isPersonalGuideSheetOpen, setIsPersonalGuideSheetOpen] = useState(false);

  useEffect(() => {
    const chat = mockChats.find((c) => c.id === id);
    if (chat) {
      setConversation(chat);
      setMessages(chat.messages);
    }
  }, [id]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const handleNewMessage = (newMessage: ChatMessage) => {
    setMessages((prev) => [...prev, newMessage]);
    // Simulate reply
    setTimeout(() => {
        setMessages((prev) => [...prev, {
            id: crypto.randomUUID(),
            sender: 'them',
            text: '¡Suena encantador! Cuéntame más.',
            timestamp: new Date().toISOString()
        }]);
    }, 1500);
  };
  
  const handleSendIcebreaker = (icebreaker: string) => {
      handleNewMessage({
        id: crypto.randomUUID(),
        sender: 'me',
        text: icebreaker,
        timestamp: new Date().toISOString(),
      });
      setIsIcebreakerSheetOpen(false);
  }

  const handleSendGameInvite = (gameTitle: string, gamePath: string) => {
    handleNewMessage({
        id: crypto.randomUUID(),
        sender: 'me',
        text: `¡Te invito a jugar a "${gameTitle}"! ¿Te animas? 😊`,
        timestamp: new Date().toISOString()
    })
    setIsGameSheetOpen(false);
    router.push(gamePath);
  }


  const handleUnmatch = () => {
    toast({
        title: "Match deshecho",
        description: `Ya no verás a ${conversation?.participant.name} ni te comunicarás con ella.`,
    })
    router.push('/chat');
  }

  const handleReport = () => {
    toast({
        title: "Usuario reportado",
        description: `Gracias por tu colaboración. Tu conversación con ${conversation?.participant.name} ha sido eliminada y no volverás a verlo.`,
    })
    // In a real app, you'd also filter this user out from discover, etc.
    router.push('/chat');
  }
  
  const handleDeleteConversation = () => {
    setMessages([]);
    toast({
        title: "Conversación eliminada",
        description: "Se han borrado todos los mensajes de este chat.",
    })
  }


  if (!conversation) {
    return (
      <div className="flex h-screen items-center justify-center md:pl-60">
        <p>Cargando chat...</p>
      </div>
    );
  }

  const { participant } = conversation;

  return (
    <div className="flex h-screen flex-col md:pl-60">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={participant.photos[0]} alt={participant.name} data-ai-hint="person" />
          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <h2 className="font-semibold">{participant.name}</h2>
        
        <div className="ml-auto">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="ml-auto">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                         <Link href={`/profile/${participant.id}`} className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={participant.photos[0]} alt={participant.name} data-ai-hint="person" />
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>Ver Perfil</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                     <Sheet open={isIcebreakerSheetOpen} onOpenChange={setIsIcebreakerSheetOpen}>
                        <SheetTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center">
                                <MessageSquareQuote className="mr-2 h-4 w-4" />
                                <span>Rompehielos</span>
                            </DropdownMenuItem>
                        </SheetTrigger>
                        <SheetContent className="flex flex-col">
                            <SheetHeader>
                                <SheetTitle>Rompehielos</SheetTitle>
                                <CardDescription>Selecciona una pregunta para iniciar una conversación interesante.</CardDescription>
                            </SheetHeader>
                            <ScrollArea className="flex-1 -mx-6 px-6">
                                <div className="py-4 space-y-4">
                                    {Object.entries(icebreakers).map(([category, questions]) => (
                                        <div key={category}>
                                            <h4 className="font-semibold text-sm mb-2 text-primary">{category}</h4>
                                            <div className="space-y-2">
                                                {questions.map((ice, i) => (
                                                    <div 
                                                        key={i}
                                                        className="p-3 rounded-md bg-secondary hover:bg-primary/10 cursor-pointer text-sm"
                                                        onClick={() => handleSendIcebreaker(ice)}
                                                    >
                                                        {ice}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </SheetContent>
                     </Sheet>
                     <Sheet open={isGameSheetOpen} onOpenChange={setIsGameSheetOpen}>
                        <SheetTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center">
                                <Gamepad2 className="mr-2 h-4 w-4" />
                                <span>Invitar a un juego</span>
                            </DropdownMenuItem>
                        </SheetTrigger>
                         <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Invitar a Jugar</SheetTitle>
                                <CardDescription>Selecciona un juego para romper el hielo con {participant.name}.</CardDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                               {games.map(game => {
                                 const Icon = game.icon;
                                 return (
                                     <Card 
                                        key={game.id}
                                        className="cursor-pointer hover:border-primary"
                                        onClick={() => handleSendGameInvite(game.title, game.path)}
                                     >
                                       <CardHeader>
                                           <div className="flex items-center gap-3">
                                               <div className="p-3 bg-primary/10 rounded-full">
                                                    <Icon className="w-6 h-6 text-primary"/>
                                                </div>
                                                <div>
                                                    <CardTitle className="text-base">{game.title}</CardTitle>
                                                    <CardDescription className="text-xs">{game.description}</CardDescription>
                                                </div>
                                           </div>
                                       </CardHeader>
                                   </Card>
                                 )
                               })}
                            </div>
                        </SheetContent>
                     </Sheet>
                     <DropdownMenuSeparator />
                     <Sheet open={isPersonalGuideSheetOpen} onOpenChange={setIsPersonalGuideSheetOpen}>
                        <SheetTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center">
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>Guía Personal</span>
                            </DropdownMenuItem>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Guía Personal de {participant.name}</SheetTitle>
                                <SheetDescription>Una pequeña ayuda para que vuestra comunicación fluya mejor.</SheetDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                               {participant.personalGuide && participant.personalGuide.length > 0 ? (
                                   participant.personalGuide.map(guideline => (
                                   <Card key={guideline.title}>
                                       <CardHeader>
                                            <CardTitle className="text-base">{guideline.title}</CardTitle>
                                            <CardDescription>{guideline.description}</CardDescription>
                                       </CardHeader>
                                   </Card>
                               ))) : (
                                   <div className="text-center text-muted-foreground pt-10">
                                       <p>{participant.name} aún no ha configurado su guía personal.</p>
                                   </div>
                               )}
                            </div>
                        </SheetContent>
                     </Sheet>
                     <Sheet open={isGuideSheetOpen} onOpenChange={setIsGuideSheetOpen}>
                        <SheetTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center">
                                <BookHeart className="mr-2 h-4 w-4" />
                                <span>Guía de la Comunidad</span>
                            </DropdownMenuItem>
                        </SheetTrigger>
                         <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Guía de la Comunidad</SheetTitle>
                                <CardDescription>Consejos para una conexión respetuosa y auténtica.</CardDescription>
                            </SheetHeader>
                            <div className="py-4 space-y-4">
                               {communityGuidelines.map(guideline => (
                                   <Card key={guideline.title}>
                                       <CardHeader>
                                            <CardTitle className="text-base">{guideline.title}</CardTitle>
                                            <CardDescription>{guideline.text}</CardDescription>
                                       </CardHeader>
                                   </Card>
                               ))}
                            </div>
                        </SheetContent>
                     </Sheet>
                    <DropdownMenuSeparator />
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                <span>Reportar</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Reportar a {participant.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tu reporte es anónimo. Si consideras que este usuario ha violado nuestras normas, nuestro equipo de moderación revisará su perfil. Esta acción eliminará vuestra conversación y no volveréis a veros.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleReport} className="bg-destructive text-destructive-foreground">Reportar y Bloquear</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Deshacer match</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Seguro que quieres deshacer el match?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es permanente. No podrás volver a ver el perfil de {participant.name} ni contactar con ella a menos que volváis a coincidir.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleUnmatch} className="bg-destructive text-destructive-foreground">Deshacer Match</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Eliminar conversación</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar esta conversación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Los mensajes se borrarán permanentemente y no se podrán recuperar. La otra persona aún podrá ver la conversación.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteConversation} className="bg-destructive text-destructive-foreground">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </header>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} participant={participant}/>
        ))}
      </div>

      <div className="mt-auto border-t p-2">
        <ChatInput onNewMessage={handleNewMessage} />
      </div>
    </div>
  );
}
