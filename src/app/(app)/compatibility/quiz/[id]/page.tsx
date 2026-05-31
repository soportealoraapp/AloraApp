
"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Check, PartyPopper, RefreshCw, Send, Eye } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { mockProfiles, UserProfile, mockChats } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import placeholderImages from '@/lib/placeholder-images.json';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { ChatMessage } from '@/lib/actions';

const quizzes = {
  personalidad: {
    title: 'Test de Personalidad',
    questions: [
      {
        question: 'Una tarde libre ideal para ti es...',
        answers: ['Una aventura espontánea', 'Relajándome en casa con un libro', 'Saliendo con amigos', 'Aprendiendo algo nuevo'],
      },
      {
        question: 'En un grupo, tú eres quien...',
        answers: ['Hace reír a todos', 'Organiza los planes', 'Escucha atentamente', 'Inicia debates profundos'],
      },
      {
        question: 'Lo que más valoras en una pareja es...',
        answers: ['El sentido del humor', 'La lealtad y estabilidad', 'La inteligencia y curiosidad', 'La amabilidad y empatía'],
      },
      {
        question: '¿Cómo prefieres comunicarte en una relación?',
        answers: ['Con total transparencia y honestidad, siempre.', 'Con tacto y eligiendo el momento adecuado.', 'A través de acciones más que de palabras.', 'Con mucho humor y sin tomarlo todo tan en serio.'],
      },
      {
        question: '¿Qué te frustra más en una cita?',
        answers: ['La falta de conversación', 'Que no tengan iniciativa', 'La impuntualidad', 'La negatividad constante'],
      },
      {
        question: 'Tu lenguaje del amor principal es...',
        answers: ['Palabras de afirmación', 'Actos de servicio', 'Recibir regalos', 'Tiempo de calidad', 'Contacto físico'],
      },
       {
        question: 'Cuando te enfrentas a un conflicto, tú...',
        answers: ['Lo abordo de frente para resolverlo', 'Necesito espacio para procesarlo', 'Busco un punto medio', 'Intento evitarlo si es posible'],
      },
      {
        question: '¿Qué actividad te recarga más energía?',
        answers: ['Socializar en una fiesta', 'Una caminata tranquila en la naturaleza', 'Un maratón de tu serie favorita', 'Crear algo (dibujar, escribir, etc.)'],
      },
      {
        question: 'Para ti, un "match" exitoso se basa en...',
        answers: ['Química instantánea', 'Valores compartidos', 'Intereses en común', 'Conversaciones estimulantes'],
      },
      {
        question: '¿Cómo te describirían tus amigos?',
        answers: ['La divertida del grupo', 'La consejera leal', 'La creativa y soñadora', 'La líder organizada'],
      }
    ],
    results: [
        { type: "La Aventura Empática", description: "Eres curiosa, abierta a nuevas experiencias y valoras profundamente la conexión emocional. Buscas a alguien que sea tu compañero de aventuras y tu confidente." },
        { type: "La Intelectual Apasionada", description: "Te atraen las conversaciones profundas y la inteligencia. Eres leal y buscas una pareja con la que puedas crecer y aprender constantemente." },
        { type: "El Alma Creativa y Libre", description: "Eres independiente, valoras tu espacio y te expresas a través de la creatividad. Buscas a alguien que respete tu libertad y comparta tu pasión por la vida." },
        { type: "La Comunicadora Carismática", description: "Eres sociable, optimista y te comunicas con facilidad. Buscas a alguien con buen humor que disfrute tanto de un buen plan como de una conversación interesante." }
    ]
  },
  planes: {
    title: 'Planes y Preferencias',
    questions: [
      {
        question: 'Tu plan de viernes por la noche perfecto es...',
        answers: ['Cena y cócteles en un sitio de moda', 'Peli y manta en el sofá', 'Concierto o evento cultural', 'Noche de juegos con amigos'],
      },
      {
        question: 'Si pudieras elegir un destino para una escapada, sería...',
        answers: ['Una cabaña acogedora en la montaña', 'Un apartamento chic en una gran ciudad', 'Un resort con todo incluido en la playa', 'Una ruta de mochila y aventura'],
      },
      {
        question: 'A la hora de comer, prefieres...',
        answers: ['Probar el último restaurante viral', 'Cocinar algo rico en casa', 'Pedir comida a domicilio sin complicaciones', 'Ir a un mercado y picar algo'],
      },
      {
        question: '¿Qué tipo de vacaciones te recarga más las pilas?',
        answers: ['Explorar una nueva cultura y museos', 'Desconectar totalmente en la naturaleza', 'Fiesta y vida social hasta el amanecer', 'Un retiro de bienestar y yoga'],
      },
      {
        question: 'Un domingo por la mañana ideal es...',
        answers: ['Brunch con amigas', 'Paseo largo con mi perro', 'Mercado de agricultores', 'Dormir hasta tarde sin culpa'],
      },
      {
        question: 'Para un aniversario, prefieres...',
        answers: ['Una cena súper romántica', 'Una experiencia de aventura (paracaídas, etc.)', 'Un regalo significativo y personal', 'Un viaje de fin de semana improvisado'],
      },
      {
        question: 'El mejor tipo de cita es...',
        answers: ['Algo activo: bolos, patinaje...', 'Una visita a una galería de arte o museo', 'Un café y una buena charla', 'Un picnic en el parque'],
      },
      {
        question: '¿Cómo te gusta celebrar tu cumpleaños?',
        answers: ['Una gran fiesta con todos mis amigos', 'Una cena íntima con mis personas favoritas', 'Un viaje a un lugar nuevo', 'Un día tranquilo solo para mí'],
      },
      {
        question: 'El ejercicio para ti es...',
        answers: ['Una clase de grupo divertida (Zumba, Spinning)', 'Correr o ir al gimnasio con mis auriculares', 'Un deporte de equipo', 'Una forma de meditar en movimiento (Yoga, Pilates)'],
      },
      {
        question: 'Si ganas la lotería, lo primero que haces es...',
        answers: ['Reservar un viaje alrededor del mundo', 'Comprar la casa de mis sueños', 'Invertir la mayor parte', 'Donar a una causa que me importa'],
      }
    ],
    results: [
      { type: "La Exploradora Epicúrea", description: "Te encanta descubrir nuevos lugares, sabores y experiencias. Valoras la espontaneidad y disfrutas de los placeres de la vida, desde una buena comida hasta un viaje inesperado." },
      { type: "El Alma Casera y Confortable", description: "Encuentras la felicidad en la comodidad de tu hogar y en planes tranquilos. Valoras la intimidad, la relajación y las conexiones profundas en un ambiente acogedor." },
      { type: "La Socialité Cultural", description: "Disfrutas estando rodeada de gente y te nutres de eventos culturales y sociales. Te encanta la energía de la ciudad, los conciertos y probar los sitios de moda." },
      { type: "La Aventurera Consciente", description: "Te gustan las actividades al aire libre y las experiencias que te conectan con la naturaleza y contigo misma. Valoras tanto la adrenalina como la paz interior." }
    ]
  },
  peliculas: {
    title: 'Trivia de Noche de Películas',
    questions: [
        { question: '¿Qué película ganó el Oscar a la Mejor Película en 1994?', answers: ['Forrest Gump', 'Pulp Fiction', 'Sueños de libertad', 'El rey león'] },
        { question: '¿Qué director te parece más icónico?', answers: ['Quentin Tarantino', 'Wes Anderson', 'Christopher Nolan', 'Greta Gerwig'] },
        { question: 'Tu cita de película ideal es en...', answers: ['Un cine de verano', 'Un autocine clásico', 'En casa con mantas y palomitas', 'Un festival de cine independiente'] },
        { question: '¿Qué género de película nunca te cansas de ver?', answers: ['Comedia romántica', 'Ciencia ficción', 'Thriller psicológico', 'Drama de época'] },
        { question: '¿Qué personaje de ficción te gustaría que fuera tu mejor amigo/a?', answers: ['Hermione Granger (Harry Potter)', 'Samwise Gamgee (El Señor de los Anillos)', 'Phoebe Buffay (Friends)', 'Tony Stark (Marvel)'] },
        { question: '¿Cuál de estas frases de película es tu lema?', answers: ['"Que la fuerza te acompañe"', '"Carpe Diem. Aprovechad el día"', '"Hakuna Matata"', '"Prefiero lamentar las cosas que he hecho que las que no he hecho"'] },
        { question: 'Si tu vida fuera una película, ¿quién la dirigiría?', answers: ['Sofia Coppola', 'Pedro Almodóvar', 'Tim Burton', 'Nancy Meyers'] },
        { question: '¿Qué prefieres en una noche de cine?', answers: ['Palomitas saladas', 'Palomitas dulces', 'Nachos con queso', 'Chocolate y golosinas'] },
        { question: '¿Qué película te hizo llorar más?', answers: ['Titanic', 'Coco', 'La vida es bella', 'Up'] },
        { question: 'Elige un universo cinematográfico para vivir en él:', answers: ['El mundo mágico de Harry Potter', 'La Tierra Media', 'Una galaxia muy, muy lejana (Star Wars)', 'El Universo Cinematográfico de Marvel (MCU)'] }
    ],
     results: [
      { type: "La Romántica de Videoclub", description: "Adoras las grandes historias de amor, las comedias que te hacen sentir bien y los finales felices. Para ti, las películas son una escapada mágica." },
      { type: "La Cinéfila de Culto", description: "Te fascinan los directores con una visión única, las tramas complejas y el cine que te hace pensar. Disfrutas analizando cada detalle." },
      { type: "La Fanática de la Fantasía", description: "Te sumerges por completo en mundos épicos, batallas galácticas y aventuras extraordinarias. El cine es tu portal a otros universos." },
      { type: "La Crítica Intelectual", description: "Disfrutas de los thrillers inteligentes, los dramas profundos y las películas que desafían tus expectativas. Valoras un buen guion por encima de todo." }
    ]
  },
  musica: {
    title: 'Época de Música Favorita',
    questions: [
        { question: '¿Qué década musical te define?', answers: ['Los 70 (Disco, Rock Clásico)', 'Los 80 (Pop, New Wave)', 'Los 90 (Grunge, Hip Hop)', 'Los 2000 (Pop Punk, R&B)'] },
        { question: 'Tu concierto soñado sería de...', answers: ['Queen', 'Daft Punk', 'Rosalía', 'Taylor Swift'] },
        { question: 'Prefieres escuchar música en...', answers: ['Vinilo', 'Un buen par de auriculares', 'En directo en un concierto', 'En un bar con amigos'] },
        { question: '¿Cuál es tu formato de álbum favorito?', answers: ['Un álbum conceptual con una historia', 'Un "grandes éxitos" lleno de temazos', 'Un álbum en directo con la energía del público', 'Un EP corto y directo'] },
        { question: 'Si pudieras ser una estrella de rock, ¿qué instrumento tocarías?', answers: ['Guitarra eléctrica', 'Batería', 'Bajo', 'El/la cantante principal'] },
        { question: 'La mejor canción para un viaje en coche es...', answers: ['Una de rock clásico para cantar a gritos', 'Una canción pop energética', 'Una balada indie tranquila', 'Un temazo de electrónica para la autopista'] },
        { question: '¿Qué festival de música te representa más?', answers: ['Coachella (Pop, Indie)', 'Primavera Sound (Alternativo, Electrónica)', 'Tomorrowland (EDM)', 'Un festival de jazz local'] },
        { question: '¿Cómo descubres música nueva?', answers: ['Playlists de Spotify/Apple Music', 'Recomendaciones de amigos', 'Bandas sonoras de películas/series', 'La radio o TikTok'] },
        { question: 'Una canción que te ponga de buen humor al instante es...', answers: ['"Don\'t Stop Me Now" - Queen', '"Happy" - Pharrell Williams', '"Walking on Sunshine" - Katrina & The Waves', '"Good as Hell" - Lizzo'] },
        { question: '¿Qué es más importante para ti en una canción?', answers: ['La letra y el mensaje', 'El ritmo y la melodía', 'La producción y el sonido', 'La emoción que transmite'] }
    ],
    results: [
      { type: "El Alma Nostálgica", description: "Te encanta la música de décadas pasadas. Para ti, las canciones son máquinas del tiempo que te transportan a los mejores momentos." },
      { type: "La Cazadora de Tendencias", description: "Siempre estás a la última, descubriendo nuevos artistas y géneros. Tu playlist es un reflejo de lo que está sonando ahora mismo." },
      { type: "La Purista del Sonido", description: "Valoras la calidad del sonido, la producción y la experiencia auditiva. Disfrutas de la música de una forma profunda y técnica." },
      { type: "La Fan de Festivales", description: "Vives por la música en directo. Para ti, la mejor forma de experimentar una canción es rodeada de gente y con la energía de un concierto." }
    ]
  },
  'cultura-general': {
    title: 'Trivia de Cultura General',
    questions: [
        { question: '¿Cuál es el río más largo del mundo?', answers: ['Nilo', 'Amazonas', 'Yangtsé', 'Misisipi'] },
        { question: '¿Quién pintó la "Mona Lisa"?', answers: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'] },
        { question: '¿En qué país se encuentra la Torre Eiffel?', answers: ['Italia', 'España', 'Francia', 'Alemania'] },
        { question: '¿Cuál es el océano más grande del mundo?', answers: ['Atlántico', 'Índico', 'Ártico', 'Pacífico'] },
        { question: '¿Qué planeta es conocido como el "Planeta Rojo"?', answers: ['Venus', 'Marte', 'Júpiter', 'Saturno'] },
        { question: '¿Quién escribió "Cien años de soledad"?', answers: ['Mario Vargas Llosa', 'Julio Cortázar', 'Gabriel García Márquez', 'Isabel Allende'] },
        { question: '¿Cuál es la capital de Australia?', answers: ['Sídney', 'Melbourne', 'Canberra', 'Perth'] },
        { question: '¿En qué año llegó el hombre a la Luna?', answers: ['1965', '1969', '1972', '1961'] },
        { question: '¿Qué elemento químico tiene el símbolo "Au"?', answers: ['Plata', 'Oro', 'Argón', 'Aluminio'] },
        { question: '¿Quién fue la primera mujer en ganar un Premio Nobel?', answers: ['Marie Curie', 'Rosalind Franklin', 'Ada Lovelace', 'Dorothy Hodgkin'] }
    ],
    results: [
      { type: "La Mente Curiosa", description: "Te encanta aprender sobre todo un poco. Disfrutas de los datos curiosos y tienes un conocimiento general sorprendentemente amplio." },
      { type: "La Experta en Geografía e Historia", description: "Te apasionan los lugares, las culturas y los grandes eventos del pasado. Podrías ganar cualquier Trivial sobre capitales o batallas." },
      { type: "La Amante del Arte y la Literatura", description: "Reconoces una obra de arte a kilómetros y te sabes de memoria tus citas literarias favoritas. Tienes una gran sensibilidad artística." },
      { type: "La Científica Aficionada", description: "Te fascina cómo funciona el mundo, desde el cosmos hasta las partículas más pequeñas. La ciencia es tu mayor fuente de asombro." }
    ]
  },
  ruleta: {
    title: 'Ruleta de Retos',
    isRoulette: true,
    challenges: [
      "Envía la última foto que hiciste con tu móvil (¡la última de verdad!).",
      "Comparte tu 'placer culpable' musical, esa canción que te da vergüenza admitir que te encanta.",
      "Describe tu cita perfecta en menos de 30 segundos.",
      "Envía un audio cantando el estribillo de tu canción favorita.",
      "Cuenta el chiste más malo que te sepas.",
      "Comparte un dato curioso sobre ti que nadie se esperaría.",
      "Muéstrale el fondo de pantalla de tu móvil y explica por qué lo elegiste.",
      "Propón un plan divertido para vuestra primera cita.",
      "Confiesa cuál es tu emoji más usado recientemente.",
      "Comparte la primera nota que tengas en tu bloc de notas.",
      "Envía una foto de tus zapatos de hoy.",
      "Describe tu día ideal usando solo 3 emojis."
    ],
  },
};

export default function QuizPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as keyof typeof quizzes;
  const quizData = quizzes[quizId];
  const { toast } = useToast();
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [compatibleProfiles, setCompatibleProfiles] = useState<any[]>([]);
  const [personalityResult, setPersonalityResult] = useState({ type: '', description: '' });
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  // State for roulette
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteResult, setRouletteResult] = useState('');
  const [isSendSheetOpen, setIsSendSheetOpen] = useState(false);

  useEffect(() => {
    if (showResults && quizId !== 'ruleta') {
      const fetchSimilarProfiles = async () => {
        setLoadingProfiles(true);
        try {
          if ('results' in quizData && quizData.results) {
            const randomResult = quizData.results[Math.floor(Math.random() * quizData.results.length)];
            setPersonalityResult(randomResult);
          }

          const archetype = personalityResult.type || ('results' in quizData && quizData.results
            ? quizData.results[Math.floor(Math.random() * quizData.results.length)].type
            : '');

          const response = await fetch(
            `/api/compatibility/similar?quizId=${quizId}&archetype=${encodeURIComponent(archetype)}&score=75`
          );
          const data = await response.json();
          setCompatibleProfiles(data.profiles || []);
        } catch (error) {
          console.error('Error fetching similar profiles:', error);
          setCompatibleProfiles([]);
        } finally {
          setLoadingProfiles(false);
        }
      };

      fetchSimilarProfiles();
    }
  }, [showResults, quizId, quizData])

  const handleSpinRoulette = () => {
    if (isSpinning || !quizData || !('challenges' in quizData)) return;

    setIsSpinning(true);
    setRouletteResult('');

    const spinDuration = 3000; 
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * quizData.challenges.length);
        setRouletteResult(quizData.challenges[randomIndex]);
        setIsSpinning(false);
    }, spinDuration);
  };
  
  const handleSendChallenge = (chatId: string) => {
    // In a real app, this would update a global state or database
    // For now, we'll just simulate it and navigate
    const newMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'me',
      text: `🎲 ¡Te reto a esto de la Ruleta de Retos!\n\n"${rouletteResult}"`,
      timestamp: new Date().toISOString(),
    };
    console.log("Sending message", newMessage, "to chat", chatId);

    setIsSendSheetOpen(false);
    toast({
        title: "¡Reto enviado!",
        description: "Tu reto ha sido enviado. ¡A ver qué responden!",
    });
    router.push(`/chat/${chatId}`);
  };

  if (!quizData) {
    return (
        <div className="md:pl-60 h-screen flex flex-col items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Juego no encontrado</CardTitle>
                <CardDescription>Este juego no existe o ha sido eliminado.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full">
                    <Link href="/compatibility">Volver a los juegos</Link>
                </Button>
            </CardContent>
          </Card>
        </div>
    );
  }

  const handleAnswerClick = () => {
    if ('questions' in quizData && quizData.questions && currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  if ('isRoulette' in quizData && quizData.isRoulette) {
    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">{quizData.title}</h1>
          </header>
          <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <CardTitle className="text-2xl">¡Atrévete!</CardTitle>
                    <CardDescription>Gira la ruleta y completa el reto que te toque. Puedes hacerlo tú o retar a tu match. ¿Quién empieza?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="h-24 flex items-center justify-center rounded-lg bg-secondary p-4 text-center">
                        {isSpinning && <p className="text-muted-foreground animate-pulse">Girando...</p>}
                        {!isSpinning && rouletteResult && <p className="font-semibold text-lg">{rouletteResult}</p>}
                        {!isSpinning && !rouletteResult && <p className="text-muted-foreground">¡Haz clic en "Girar Ruleta" para empezar!</p>}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button className="w-full" onClick={handleSpinRoulette} disabled={isSpinning}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", isSpinning && "animate-spin")} />
                            {isSpinning ? 'Girando...' : 'Girar Ruleta'}
                        </Button>
                        <Sheet open={isSendSheetOpen} onOpenChange={setIsSendSheetOpen}>
                            <SheetTrigger asChild>
                                <Button className="w-full" variant="secondary" disabled={!rouletteResult || isSpinning}>
                                    <Send className="mr-2 h-4 w-4" />
                                    Enviar como mensaje
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Enviar Reto</SheetTitle>
                                    <SheetDescription>Selecciona una conversación para enviar este reto.</SheetDescription>
                                </SheetHeader>
                                <div className="py-4 space-y-2">
                                    {mockChats.map(chat => (
                                        <div 
                                            key={chat.id} 
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                                            onClick={() => handleSendChallenge(chat.id)}
                                        >
                                            <Avatar className="h-10 w-10 border">
                                                <AvatarImage src={chat.participant.photos[0]} alt={chat.participant.name} />
                                                <AvatarFallback>{chat.participant.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <p className="font-semibold">{chat.participant.name}</p>
                                        </div>
                                    ))}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>
          </main>
        </div>
    );
  }

  const progress = ('questions' in quizData && quizData.questions) ? ((currentQuestion + 1) / quizData.questions.length) * 100 : 0;

  return (
    <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold md:text-2xl font-headline">{quizData.title}</h1>
      </header>
      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-lg text-center">
            {showResults ? (
                <>
                <CardHeader>
                    <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center mb-4">
                        <PartyPopper className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">¡Test completado!</CardTitle>
                    {personalityResult.type ? (
                         <>
                            <CardDescription>Tu arquetipo es:</CardDescription>
                            <p className="text-xl font-bold text-primary pt-2">{personalityResult.type}</p>
                         </>
                    ) : (
                         <CardDescription>¡Buen trabajo! Tus respuestas nos ayudan a encontrar 'matches' más compatibles.</CardDescription>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {personalityResult.description && (
                        <div className="rounded-lg border bg-secondary p-4 text-sm text-secondary-foreground">
                            {personalityResult.description}
                        </div>
                    )}
                    <div className="space-y-3">
                         <h4 className="font-semibold text-left">Personas con resultados similares</h4>
                         {loadingProfiles && (
                            <div className="text-center py-4 text-sm text-muted-foreground">Buscando personas compatibles...</div>
                         )}
                         {!loadingProfiles && compatibleProfiles.length === 0 && (
                            <div className="text-center py-4 text-sm text-muted-foreground">Aún no hay personas con resultados similares</div>
                         )}
                         {compatibleProfiles.map(profile => (
                            <div key={profile.id} className="flex items-center justify-between rounded-lg border p-3 text-left">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-12 w-12 border">
                                        <AvatarImage src={profile.photo} alt={profile.name} data-ai-hint="person" />
                                        <AvatarFallback>{profile.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{profile.name}, {profile.age}</p>
                                        <p className="text-sm text-muted-foreground">{profile.city}</p>
                                    </div>
                                </div>
                                <Button asChild variant="secondary" size="sm">
                                    <Link href={`/profile/${profile.id}`}>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Ver Perfil
                                    </Link>
                                </Button>
                            </div>
                         ))}
                    </div>
                    <div className="pt-4 space-y-2">
                        <Button asChild className="w-full">
                            <Link href="/discover">Ver más perfiles compatibles</Link>
                        </Button>
                        <Button asChild variant="secondary" className="w-full">
                            <Link href="/compatibility">Jugar a otro juego</Link>
                        </Button>
                    </div>
                </CardContent>
                </>
            ) : (
                'questions' in quizData && quizData.questions && (
                <>
                <CardHeader>
                    <Progress value={progress} className="mb-4" />
                    <CardTitle className="text-xl">{quizData.questions[currentQuestion].question}</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {quizData.questions[currentQuestion].answers.map((answer, i) => (
                        <Button key={i} variant="outline" size="lg" className="h-auto py-4" onClick={handleAnswerClick}>
                           {answer}
                        </Button>
                    ))}
                </CardContent>
                </>
                )
            )}
        </Card>
      </main>
    </div>
  );
}

    

    
