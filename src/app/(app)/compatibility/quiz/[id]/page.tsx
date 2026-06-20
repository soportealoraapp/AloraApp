"use client";

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, PartyPopper, Send, Eye } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { COMPATIBILITY_QUIZZES, ARCHETYPES, calculateQuizScore, determineArchetype } from '@/lib/compatibility/quizzes';
import { useAuth } from '@/contexts/AuthContext';
import { trackEvent } from '@/lib/tracking/client';

interface SimilarProfile {
    id: string;
    name: string;
    age?: number;
    city?: string;
    photo?: string;
    sharedValues?: string[];
    sharedInterests?: string[];
}

export default function QuizPage() {
    const router = useRouter();
    const params = useParams();
    const quizId = params.id as string;
    const { user } = useAuth();
    const { toast } = useToast();

    const quiz = useMemo(() => COMPATIBILITY_QUIZZES.find(q => q.id === quizId), [quizId]);

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showResults, setShowResults] = useState(false);
    const [score, setScore] = useState(0);
    const [archetype, setArchetype] = useState<string>('');
    const [compatibleProfiles, setCompatibleProfiles] = useState<SimilarProfile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!showResults || !quiz || !user) return;
        const finalScore = calculateQuizScore(quiz.id, answers);
        const finalArchetype = determineArchetype(quiz.id, finalScore);
        setScore(finalScore);
        setArchetype(finalArchetype);

        let cancelled = false;
        (async () => {
            setSaving(true);
            try {
                        await fetch('/api/compatibility/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ quizId: quiz.id, answers }),
                        });
                        trackEvent('quiz_completed', { quizId: quiz.id, score: finalScore, archetype: finalArchetype });
                    } catch (err) {
                toast({
                    title: 'No pudimos guardar tu resultado',
                    description: 'Lo intentaremos de nuevo más tarde.',
                    variant: 'destructive',
                });
                console.error('save quiz error', err);
            } finally {
                if (!cancelled) setSaving(false);
            }

            setLoadingProfiles(true);
            try {
                const res = await fetch(
                    `/api/compatibility/similar?quizId=${quiz.id}&archetype=${encodeURIComponent(finalArchetype)}&score=${finalScore}`
                );
                if (!res.ok) throw new Error('similar fetch failed');
                const data = await res.json();
                if (!cancelled) {
                    setCompatibleProfiles(data.profiles || []);
                }
            } catch (err) {
                console.error('Error fetching similar profiles:', err);
                if (!cancelled) setCompatibleProfiles([]);
            } finally {
                if (!cancelled) setLoadingProfiles(false);
            }
        })();

        return () => { cancelled = true; };
    }, [showResults, quiz, answers, user, toast]);

    if (!quiz) {
        return (
            <div className="h-screen flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Quiz no encontrado</CardTitle>
                        <CardDescription>Este quiz no existe o ha sido eliminado.</CardDescription>
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

    const question = quiz.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
    const archetypeInfo = ARCHETYPES[archetype] || null;

    const handleAnswerClick = (optionId: string) => {
        const nextAnswers = { ...answers, [question.id]: optionId };
        setAnswers(nextAnswers);

        if (currentQuestion < quiz.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setShowResults(true);
        }
    };

    return (
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">{quiz.title}</h1>
            </header>
            <main className="flex items-center justify-center min-h-[calc(100dvh-4rem)] p-4">
                <Card className="w-full max-w-lg text-center">
                    {showResults ? (
                        <>
                            <CardHeader>
                                <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center mb-4">
                                    <PartyPopper className="h-10 w-10 text-primary" />
                                </div>
                                <CardTitle className="text-2xl">¡Test completado!</CardTitle>
                                {archetypeInfo && (
                                    <>
                                        <CardDescription>Tu arquetipo es:</CardDescription>
                                        <p className="text-xl font-bold text-primary pt-2">{archetypeInfo.name}</p>
                                    </>
                                )}
                                <p className="text-sm text-muted-foreground pt-2">Puntuación: {score}/100</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {archetypeInfo && (
                                    <div className="rounded-lg border bg-secondary p-4 text-sm text-secondary-foreground text-left">
                                        {archetypeInfo.description}
                                    </div>
                                )}

                                {archetypeInfo && (
                                    <div className="space-y-4 text-left">
                                        <div className="rounded-lg border p-4">
                                            <h4 className="font-semibold text-sm mb-2 text-green-600 dark:text-green-400">Fortalezas</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {archetypeInfo.strengths.map(s => (
                                                    <span key={s} className="text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <h4 className="font-semibold text-sm mb-2 text-orange-600 dark:text-orange-400">Desafíos</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {archetypeInfo.risks.map(r => (
                                                    <span key={r} className="text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full">{r}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <h4 className="font-semibold text-sm mb-2 text-purple-600 dark:text-purple-400">Cómo te perciben</h4>
                                            <p className="text-sm text-muted-foreground">{archetypeInfo.perception}</p>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <h4 className="font-semibold text-sm mb-2 text-pink-600 dark:text-pink-400">Compatibilidad ideal</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {archetypeInfo.idealPartner.map(p => (
                                                    <span key={p} className="text-xs bg-pink-50 dark:bg-pink-950 text-pink-700 dark:text-pink-300 px-2 py-1 rounded-full">{p}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 text-left">
                                    <h4 className="font-semibold">Personas similares a ti</h4>
                                    {saving && (
                                        <p className="text-xs text-muted-foreground">Guardando resultado…</p>
                                    )}
                                    {loadingProfiles && (
                                        <div className="text-center py-4 text-sm text-muted-foreground">Buscando personas compatibles…</div>
                                    )}
                                    {!loadingProfiles && compatibleProfiles.length === 0 && (
                                        <div className="text-center py-4 text-sm text-muted-foreground">Aún no hay personas con resultados similares</div>
                                    )}
                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                        {compatibleProfiles.map(profile => (
                                            <div key={profile.id} className="flex items-center justify-between rounded-lg border p-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-12 w-12 border flex-shrink-0">
                                                        <AvatarImage src={profile.photo} alt={profile.name}  />
                                                        <AvatarFallback>{profile.name?.charAt(0) || '?'}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold truncate">{profile.name}, {profile.age}</p>
                                                        <p className="text-xs text-muted-foreground truncate">{profile.city}</p>
                                                        {(profile.sharedValues?.length || profile.sharedInterests?.length) ? (
                                                            <p className="text-xs text-primary truncate">
                                                                {[...(profile.sharedValues || []), ...(profile.sharedInterests || [])].slice(0, 2).join(' · ')}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <Button asChild variant="secondary" size="sm">
                                                    <Link href={`/profile/${profile.id}`}>
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        Ver
                                                    </Link>
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
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
                        <>
                            <CardHeader>
                                <Progress value={progress} className="mb-4" />
                                <CardDescription className="text-xs">
                                    Pregunta {currentQuestion + 1} de {quiz.questions.length}
                                </CardDescription>
                                <CardTitle className="text-xl mt-2">{question.question}</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {question.options?.map(option => (
                                    <Button
                                        key={option.id}
                                        variant="outline"
                                        size="lg"
                                        className="h-auto py-4 text-left whitespace-normal"
                                        onClick={() => handleAnswerClick(option.id)}
                                    >
                                        {option.text}
                                    </Button>
                                ))}
                            </CardContent>
                        </>
                    )}
                </Card>
            </main>
        </div>
    );
}
