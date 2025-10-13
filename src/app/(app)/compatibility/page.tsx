
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clapperboard, Music, Dices, BrainCircuit, Palmtree } from "lucide-react";
import Link from "next/link";

const quizzes = [
    { id: "personalidad", title: "Test de Personalidad", description: "Descubre tu estilo de compatibilidad y el de tus 'matches'.", icon: FileText, cta: "Comenzar Test" },
    { id: "planes", title: "Planes y Preferencias", description: "¿Vuestros planes ideales son compatibles? ¡Descúbrelo!", icon: Palmtree, cta: "Comenzar Test" },
    { id: "peliculas", title: "Trivia de Noche de Películas", description: "Pon a prueba tus conocimientos de cine y ve quién sabe más.", icon: Clapperboard, cta: "Jugar Trivia" },
    { id: "musica", title: "Época de Música Favorita", description: "Encuentra vuestro gusto musical compartido.", icon: Music, cta: "Elegir Época" },
    { id: "cultura-general", title: "Trivia de Cultura General", description: "¿Cuánto sabes de todo un poco? ¡Un reto divertido!", icon: BrainCircuit, cta: "Jugar Trivia" },
    { id: "ruleta", title: "Ruleta de Retos", description: "Gira la ruleta para un reto divertido. ¡Ideal para romper el hielo!", icon: Dices, cta: "Girar la Ruleta" },
]

export default function CompatibilityPage() {
  return (
    <div className="md:pl-60">
       <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Juegos de Compatibilidad</h1>
      </header>
      <main className="p-4 space-y-6">
        <div className="text-center">
            <h2 className="text-2xl font-bold font-headline">¿Lista para jugar?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Estos juegos cortos están diseñados para ayudarte a romper el hielo, conocer mejor a tus 'matches' y, sobre todo, ¡divertiros juntas!</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quizzes.map(quiz => {
                const Icon = quiz.icon
                return (
                    <Card key={quiz.title} className="flex flex-col">
                        <CardHeader className="items-center text-center">
                             <div className="p-4 bg-primary/10 rounded-full mb-2">
                                <Icon className="w-8 h-8 text-primary"/>
                            </div>
                            <CardTitle>{quiz.title}</CardTitle>
                            <CardDescription>{quiz.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end justify-center">
                           <Button asChild className="w-full">
                               <Link href={`/compatibility/quiz/${quiz.id}`}>{quiz.cta}</Link>
                           </Button>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
      </main>
    </div>
  );
}
