"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useSendLike } from "@/hooks/use-send-like";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeChipList } from "@/components/profile/BadgeChip";
import { SpotifySection } from "@/components/profile/SpotifySection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageSquare, Sparkles, MapPin, Cigarette, GlassWater, Baby, Star, BookOpen, X, UserCheck, Loader2, Mic, Church, Check, Send, Smile } from "lucide-react";
import { HeartArrow } from "@/components/ui/custom/HeartArrow";
import { ProfileHighlights } from "@/components/profile/ProfileHighlights";
import { PromptCards } from "@/components/profile/PromptCards";
import { FavoriteButton } from "@/components/profile/FavoriteButton";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import { VoicePlayer } from "@/components/audio/VoicePlayer";
import { SafeImage } from "@/components/ui/safe-image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const detailIcons: { [key: string]: React.ElementType } = {
    city: MapPin,
    zodiacSign: Star,
    education: BookOpen,
    smoking: Cigarette,
    drinking: GlassWater,
    children: Baby,
    religion: Church,
};

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile: currentUserProfile } = useAuth();
    const { id } = params;
    const { toast } = useToast();
    const { sendLike } = useSendLike();

    const [isLiked, setIsLiked] = useState(false);
    const [isSuperMatched, setIsSuperMatched] = useState(false);
    const [isPassed, setIsPassed] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [hasExistingMatch, setHasExistingMatch] = useState(false);
    const [existingMatchId, setExistingMatchId] = useState<string | null>(null);

    // Daily question (match context) — only relevant when viewing a match
    const [dailyQuestion, setDailyQuestion] = useState<string | null>(null);
    const [dailyQuestionId, setDailyQuestionId] = useState<string | null>(null);
    const [matchAnswer, setMatchAnswer] = useState<string | null>(null);
    const [myAnswer, setMyAnswer] = useState('');
    const [answerSubmitting, setAnswerSubmitting] = useState(false);
    const [answerDone, setAnswerDone] = useState(false);
    const [compatibility, setCompatibility] = useState<{ score: number; breakdown?: Record<string, number>; explanations?: string[] } | null>(null);

    const source = searchParams.get("source");
    const isPreview = searchParams.get("preview") === "1";
    const intent = (searchParams.get("intent") as 'dating' | 'friendship' | 'both' | null) || 'dating';
    const isFromNewMatch = source === "new-match";

    const { profile, loading } = useProfile(id as string);

    // Effective intent for this profile — drives whether romantic (Flechado) actions are shown
    const effectiveIntent: 'dating' | 'friendship' =
      intent !== 'both'
        ? intent
        : (profile?.connectionModes?.length === 1 && profile.connectionModes[0] === 'friendship'
            ? 'friendship'
            : 'dating');

    const goBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            window.history.back();
        } else {
            router.push('/discover');
        }
    };

    useEffect(() => {
      if (!id || !user || isPreview) return;
      const controller = new AbortController();
      fetch(`/api/match/check?targetUserId=${id}&intent=${intent}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          setHasExistingMatch(data.matched);
          if (data.matchId) {
            setExistingMatchId(data.matchId);
          }
          // Restore like/flechado/pass state from existing interaction
          if (data.interactionType === 'superlike') {
            setIsSuperMatched(true);
            setIsLiked(true);
          } else if (data.interactionType === 'like') {
            setIsLiked(true);
          } else if (data.interactionType === 'pass') {
            setIsPassed(true);
          }
        })
        .catch(() => {});
      return () => controller.abort();
    }, [id, user, isPreview]);

    useEffect(() => {
      if (!id || !user || isPreview || id === user?.id) return;
      if (currentUserProfile?.subscriptionStatus !== 'plus') return;
      const controller = new AbortController();
      fetch(`/api/compatibility/score?targetId=${id}`, { signal: controller.signal })
        .then(r => r.json())
        .then(data => {
          if (data.score !== undefined) {
            setCompatibility({ score: data.score, breakdown: data.breakdown, explanations: data.explanations });
          }
        })
        .catch(() => {});
      return () => controller.abort();
    }, [id, user, isPreview, currentUserProfile?.subscriptionStatus]);

    // Load today's daily question + the match's answer to it (only when matched)
    useEffect(() => {
      if (!id || !user || isPreview || !hasExistingMatch) return;
      const controller = new AbortController();
      (async () => {
        try {
          const [mine, theirs] = await Promise.all([
            fetch('/api/daily-question', { signal: controller.signal })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            fetch(`/api/daily-question/answer?userId=${id}`, { signal: controller.signal })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
          ]);
          if (mine?.question) {
            setDailyQuestion(mine.question);
            setDailyQuestionId(mine.questionId);
            if (mine.userAnswer) {
              setMyAnswer(mine.userAnswer);
              setAnswerDone(true);
            }
          }
          if (theirs?.answer) {
            setMatchAnswer(theirs.answer);
          }
        } catch {}
      })();
      return () => controller.abort();
    }, [id, user, isPreview, hasExistingMatch]);

    const handleSubmitDailyAnswer = async () => {
      if (!dailyQuestionId || !myAnswer.trim() || answerSubmitting) return;
      setAnswerSubmitting(true);
      try {
        const res = await fetch('/api/daily-question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId: dailyQuestionId, answer: myAnswer.trim() }),
        });
        if (!res.ok) throw new Error('Error al guardar');
        setAnswerDone(true);
        toast({ title: 'Respuesta guardada', description: 'Tu respuesta ya se ve en tu perfil.' });
      } catch {
        toast({ title: 'Error', description: 'No se pudo guardar tu respuesta.', variant: 'destructive' });
      } finally {
        setAnswerSubmitting(false);
      }
    };

    if (loading) {
        return (
            <div>
                <header className="app-page-header gap-4 sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="pb-24 md:pb-4">
                    <Skeleton className="w-full h-96" />
                    <div className="p-4 space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
                    </div>
                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="app-page-shell items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Perfil no encontrado</p>
                    <Button onClick={() => goBack()}>Volver</Button>
                </div>
            </div>
        );
    }

    const mainPhoto = profile.photos?.[0] || "/placeholder.svg";

    const details = [
        { label: "Ubicación", value: profile.city, icon: "city" },
        { label: "Signo", value: profile.zodiacSign, icon: "zodiacSign" },
        { label: "Educación", value: profile.education, icon: "education" },
        { label: "Tabaco", value: profile.smoking, icon: "smoking" },
        { label: "Alcohol", value: profile.drinking, icon: "drinking" },
        { label: "Hijos", value: profile.children, icon: "children" },
        { label: "Religión", value: profile.religion, icon: "religion" },
    ].filter((detail) => detail.value);

    const handleLike = async () => {
        if (isLiked || processing) return;

        setProcessing(true);
        try {
            const result = await sendLike(id as string, "like", effectiveIntent);
            setIsLiked(true);

            if (result.matched) {
                toast({
                    title: `¡Conexión con ${profile.displayName}! 🎉`,
                    description: "Ahora pueden chatear",
                });
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error sending like:", error);
            toast({ title: "Error", description: "No se pudo enviar el like. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleSuperMatch = async () => {
        if (isSuperMatched || processing) return;

        setProcessing(true);
        try {
            const result = await sendLike(id as string, "superlike", effectiveIntent);
            setIsSuperMatched(true);
            setIsLiked(true);

            if (result.matched) {
                toast({
                    title: `¡Flechado con ${profile.displayName}! ✨`,
                    description: "Tu interés destaca y ahora pueden chatear",
                    duration: 5000,
                });
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error enviando Flechado:", error);
            toast({ title: "Error", description: "No se pudo enviar el Flechado. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleAcceptMatch = async () => {
        setProcessing(true);
        try {
            const result = await sendLike(id as string, "like", effectiveIntent, false);

            toast({
                title: `¡Nueva conexión con ${profile.displayName}! 🎉`,
                    description: "Ahora pueden chatear",
            });

            if (result.matchId) {
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error accepting match:", error);
            toast({ title: "Error", description: "No se pudo aceptar la conexión. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeclineMatch = async () => {
        setProcessing(true);
        try {
            await sendLike(id as string, "pass", effectiveIntent);
            toast({ title: "Perfil archivado", description: "Buscaremos mejores conexiones para ti." });
            goBack();
        } catch {
            toast({ title: "Error", description: "No se pudo archivar.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleTagClick = (tag: string, type: 'interest' | 'value' | 'music') => {
        const queryParam = type === 'interest' ? 'interest' : type === 'value' ? 'value' : 'music';
        router.push(`/discover?${queryParam}=${encodeURIComponent(tag)}`);
    };

    const handlePass = async () => {
        if (processing) return;
        setProcessing(true);
        try {
            await sendLike(id as string, "pass", effectiveIntent);
        } catch {
            // Pass is best-effort, still go back
        } finally {
            setProcessing(false);
            goBack();
        }
    };

    return (
        <div>
            <header className="app-page-header gap-4 sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => goBack()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="font-headline text-xl font-bold text-gradient md:text-2xl">
                        {profile.displayName}
                    </h1>
                    {profile.isVerified && <TrustBadge type="verified" />}
                </div>
                <div className="ml-auto">
                    {user?.id !== id && <FavoriteButton profileId={id as string} />}
                </div>
            </header>

            <main className="pb-24 md:pb-4">
                <div className="w-full relative">
                    {profile.photos && profile.photos.length > 1 ? (
                        <Carousel className="w-full">
                            <CarouselContent>
                                {profile.photos.map((photo, index) => (
                                    <CarouselItem key={index}>
                                        <div className="w-full aspect-[4/5] relative">
                                            <SafeImage
                                                src={photo}
                                                alt={`Foto de ${profile.displayName} ${index + 1}`}
                                                fill
                                                sizes="(max-width: 640px) 100vw, 400px"
                                                className="object-cover"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2 z-10 shadow-lg" />
                            <CarouselNext className="right-2 z-10 shadow-lg" />
                        </Carousel>
                    ) : (
                        <SafeImage
                            src={mainPhoto}
                            alt={`Foto de ${profile.displayName}`}
                            width={600}
                            height={800}
                            className="w-full aspect-[4/5] object-cover"
                            priority
                        />
                    )}
                </div>

                <div className="app-page-content space-y-6">
                    {/* Compatibility Score Hero */}
                    {compatibility && (
                        <Card className="app-prose-section rounded-2xl border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-xl font-bold text-primary">{compatibility.score}%</span>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground">Compatible</h3>
                                            <p className="text-xs text-muted-foreground">Basado en 7 dimensiones</p>
                                        </div>
                                    </div>
                                </div>
                                {compatibility.explanations && compatibility.explanations.length > 0 && (
                                    <div className="space-y-1.5">
                                        {compatibility.explanations.slice(0, 3).map((exp, i) => (
                                            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                                <span className="text-primary mt-0.5">•</span>
                                                {exp}
                                            </p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                            <h2 className="text-3xl font-bold font-headline">
                                {profile.displayName}, {profile.age}
                            </h2>
                            {profile.quizArchetype && (
                                <Badge variant="secondary" className="rounded-full text-xs gap-1">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    {profile.quizArchetype}
                                    {profile.quizScore && ` · ${profile.quizScore}`}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {profile.city}
                            </p>
                        </div>
                    </div>

                    {profile.latestAnswer?.question && profile.latestAnswer?.answer && !hasExistingMatch && (
                        <Card className="app-prose-section rounded-2xl border-primary/10 bg-primary/5">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Pregunta del día</p>
                                </div>
                                <p className="text-sm font-medium text-foreground mb-2">{profile.latestAnswer.question}</p>
                                <div className="bg-card/50 rounded-xl p-3 border border-primary/10">
                                    <p className="text-sm text-foreground leading-relaxed">&ldquo;{profile.latestAnswer.answer}&rdquo;</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Usa esta respuesta para iniciar una conversación</p>
                            </CardContent>
                        </Card>
                    )}

                    {hasExistingMatch && dailyQuestion && (
                        <Card className="app-prose-section rounded-2xl border-primary/10 bg-primary/5">
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-primary" />
                                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Pregunta del día</p>
                                </div>
                                <p className="text-sm font-medium text-foreground">{dailyQuestion}</p>

                                {matchAnswer && (
                                    <div className="bg-card/50 rounded-xl p-3 border border-primary/10">
                                        <p className="text-xs font-medium text-muted-foreground mb-1">Su respuesta:</p>
                                        <p className="text-sm text-foreground leading-relaxed">&ldquo;{matchAnswer}&rdquo;</p>
                                    </div>
                                )}

                                {answerDone ? (
                                    <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                                        <div className="flex items-start gap-2">
                                            <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-foreground mb-1">Tu respuesta:</p>
                                                <p className="text-sm text-foreground">{myAnswer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Textarea
                                            value={myAnswer}
                                            onChange={(e) => setMyAnswer(e.target.value)}
                                            placeholder="Comparte tu respuesta..."
                                            className="min-h-[70px] max-h-[160px] resize-none text-sm"
                                            maxLength={300}
                                        />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-muted-foreground">{myAnswer.length}/300</span>
                                            <Button
                                                size="sm"
                                                onClick={handleSubmitDailyAnswer}
                                                disabled={!myAnswer.trim() || answerSubmitting}
                                                className="bg-gradient-to-r from-primary to-primary/80"
                                            >
                                                {answerSubmitting ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                                                Enviar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {profile.prompts && profile.prompts.length > 0 && (
                        <PromptCards prompts={profile.prompts} />
                    )}

                    {profile.voiceIntro && (
                        <Card className="app-prose-section rounded-2xl overflow-hidden">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Mic className="h-4 w-4 text-primary" />
                                    <h3 className="font-semibold text-sm text-foreground">Presentación de voz</h3>
                                </div>
                                <VoicePlayer src={profile.voiceIntro} />
                            </CardContent>
                        </Card>
                    )}

                    <ProfileHighlights 
                        bio={profile.bio} 
                        interests={profile.interests} 
                        values={profile.values} 
                        lookingFor={profile.lookingFor}
                        musicGenres={profile.musicGenres}
                        voiceIntro={profile.voiceIntro}
                    />

                    {profile.bio && (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {profile.interests && profile.interests.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Intereses</h3>
                                <BadgeChipList 
                                    items={profile.interests} 
                                    type="interest" 
                                    onItemClick={(tag) => handleTagClick(tag, 'interest')}
                                />
                            </div>
                        </div>
                    )}

                    {profile.values && profile.values.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Valores</h3>
                                <BadgeChipList 
                                    items={profile.values} 
                                    type="value" 
                                    onItemClick={(tag) => handleTagClick(tag, 'value')}
                                />
                            </div>
                        </div>
                    )}

                    {details.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-4">
                                    Más sobre {profile.displayName.split(" ")[0]}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {details.map((detail) => {
                                        const Icon = detailIcons[detail.icon];
                                        return (
                                            <div
                                                key={detail.label}
                                                className="flex items-center gap-3 text-sm"
                                            >
                                                {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{detail.value}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {detail.label}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {profile.spotify && <SpotifySection spotify={profile.spotify} isOwn={false} />}

                    {profile.personalGuide && profile.personalGuide.length > 0 && (
                        <Card>
                            <CardContent className="p-6 space-y-2">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                    <UserCheck className="h-5 w-5" /> Guía Personal
                                </h3>
                                {profile.personalGuide.map((guide, index) => (
                                    <div key={index} className="p-3 rounded-lg bg-secondary">
                                        <p className="font-semibold text-sm">{guide.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {guide.description}
                                        </p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {id !== user?.id && !isPreview && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t md:sticky md:bottom-0 md:z-auto md:bg-transparent md:border-none md:p-0 md:mt-4 md:px-4 md:pb-0">
                        {hasExistingMatch ? (
                            <div className="flex flex-col gap-2 justify-center max-w-sm mx-auto">
                                <Link href={existingMatchId ? `/chat/${existingMatchId}` : '/chat'} className="w-full">
                                    <Button size="lg" variant="default" className="w-full min-h-[48px]">
                                        <MessageSquare className="h-5 w-5 mr-2" />
                                        Ir al chat
                                    </Button>
                                </Link>
                            </div>
                        ) : isFromNewMatch ? (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-3">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full min-h-[48px]"
                                    onClick={handleDeclineMatch}
                                    disabled={processing}
                                >
                                    <X className="h-5 w-5 mr-2" /> Rechazar
                                </Button>
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="w-full min-h-[48px]"
                                    onClick={handleAcceptMatch}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Heart className="h-5 w-5 mr-2 fill-current" />
                                    )}
                                    Hacer Match
                                </Button>
                            </div>
                        ) : isPassed ? (
                            <div className="flex justify-center max-w-sm mx-auto">
                                <div className="flex items-center gap-3 bg-muted/50 rounded-full px-6 py-3">
                                    <span className="text-sm text-muted-foreground">Ya pasaste este perfil</span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="rounded-full text-xs"
                                        onClick={handleLike}
                                        disabled={processing}
                                    >
                                        Cambiar a Like
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-around items-center max-w-sm mx-auto gap-3">
                                {/* Pass */}
                                <button
                                    onClick={handlePass}
                                    disabled={processing}
                                    className="h-16 w-16 rounded-full border-2 border-muted-foreground/20 bg-background flex items-center justify-center shadow-lg hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-all active:scale-95"
                                    aria-label="Pasar"
                                >
                                    <X className="h-7 w-7" />
                                </button>

                                {/* Like / Amigo */}
                                <button
                                    onClick={handleLike}
                                    disabled={isLiked || processing}
                                    className={cn(
                                        'h-20 w-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 border-2',
                                        isLiked
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'bg-background border-primary/30 hover:bg-primary hover:border-primary hover:text-primary-foreground text-primary'
                                    )}
                                    aria-label={effectiveIntent === 'friendship' ? 'Enviar like de amistad' : 'Me gusta'}
                                    title={effectiveIntent === 'friendship' ? 'Amigo' : 'Me gusta'}
                                >
                                    {processing ? (
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    ) : effectiveIntent === 'friendship' ? (
                                        <Smile className={cn('h-8 w-8', isLiked && 'fill-current')} />
                                    ) : (
                                        <Heart className={cn('h-8 w-8', isLiked && 'fill-current')} />
                                    )}
                                </button>

                                {/* Flechado (Super Like) — only in dating mode */}
                                {effectiveIntent !== 'friendship' && (
                                    <button
                                        onClick={handleSuperMatch}
                                        disabled={isSuperMatched || processing}
                                        className={cn(
                                            'h-16 w-16 rounded-full border-2 flex items-center justify-center shadow-lg transition-all active:scale-95',
                                        isSuperMatched
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'bg-background border-primary/40 hover:bg-primary/10 dark:hover:bg-primary/10 hover:border-primary text-primary'
                                        )}
                                        aria-label="Flechado"
                                        title="Flechado: destaca tu interés"
                                    >
                                        <HeartArrow className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
