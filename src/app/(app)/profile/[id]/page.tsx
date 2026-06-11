"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useMatches } from "@/hooks/use-matches";
import { useAuth } from "@/contexts/AuthContext";
import { BadgeChipList } from "@/components/profile/BadgeChip";
import { SpotifySection } from "@/components/profile/SpotifySection";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MessageSquare, Sparkles, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, X, Undo, UserCheck, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileHighlights } from "@/components/profile/ProfileHighlights";
import { FavoriteButton } from "@/components/profile/FavoriteButton";
import { TrustBadge } from "@/components/ui/premium/TrustBadge";
import Image from "next/image";
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
    religion: Briefcase,
};

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { id } = params;
    const { toast } = useToast();
    const { sendLike } = useMatches();

    const [isLiked, setIsLiked] = useState(false);
    const [isSuperMatched, setIsSuperMatched] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [hasExistingMatch, setHasExistingMatch] = useState(false);
    const [compatibility, setCompatibility] = useState<{ score: number; breakdown?: Record<string, number>; explanations?: string[] } | null>(null);

    const source = searchParams.get("source");
    const isPreview = searchParams.get("preview") === "1";
    const intent = (searchParams.get("intent") as 'dating' | 'friendship' | null) || 'dating';
    const isFromNewMatch = source === "new-match";
    const isFromRejected = source === "rejected";

    const { profile, loading } = useProfile(id as string);

    useEffect(() => {
      if (!id || !user || isPreview) return;
      fetch(`/api/match/check?targetUserId=${id}`)
        .then(r => r.json())
        .then(data => setHasExistingMatch(data.matched))
        .catch(() => {});
    }, [id, user, isPreview]);

    useEffect(() => {
      if (!id || !user || isPreview || id === user?.id) return;
      fetch(`/api/compatibility/score?targetId=${id}`)
        .then(r => r.json())
        .then(data => {
          if (data.score !== undefined) {
            setCompatibility({ score: data.score, breakdown: data.breakdown, explanations: data.explanations });
          }
        })
        .catch(() => {});
    }, [id, user, isPreview]);

    if (loading) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
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
            <div className="h-screen flex items-center justify-center md:pl-60">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">Perfil no encontrado</p>
                    <Button onClick={() => router.back()}>Volver</Button>
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
            const result = await sendLike(id as string, "like", intent);
            setIsLiked(true);

            if (result.matched) {
                toast({
                    title: `¡Match con ${profile.displayName}! 🎉`,
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
            const result = await sendLike(id as string, "superlike", intent);
            setIsSuperMatched(true);
            setIsLiked(true);

            if (result.matched) {
                toast({
                    title: `¡Super Like con ${profile.displayName}! ✨`,
                    description: "Tu interés destaca y ahora pueden chatear",
                    duration: 5000,
                });
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error enviando Super Like:", error);
            toast({ title: "Error", description: "No se pudo enviar el Super Like. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleAcceptMatch = async () => {
        setProcessing(true);
        try {
            const result = await sendLike(id as string, "like", intent);

            toast({
                title: `¡Nuevo match con ${profile.displayName}! 🎉`,
                description: "Ahora podéis chatear",
            });

            if (result.matchId) {
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error accepting match:", error);
            toast({ title: "Error", description: "No se pudo aceptar el match. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    const handleDeclineMatch = () => {
        router.back();
    };

    const handleGiveSecondChance = async () => {
        setProcessing(true);
        try {
            const result = await sendLike(id as string, "like", intent);

            toast({
                title: "¡Segunda oportunidad!",
                description: `Has hecho match con ${profile.displayName}`,
            });

            if (result.matchId) {
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error giving second chance:", error);
            toast({ title: "Error", description: "No se pudo dar segunda oportunidad. Intenta de nuevo.", variant: "destructive" });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">
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
                                            <Image
                                                src={photo}
                                                alt={`Foto de ${profile.displayName} ${index + 1}`}
                                                fill
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
                        <Image
                            src={mainPhoto}
                            alt={`Foto de ${profile.displayName}`}
                            width={600}
                            height={800}
                            className="w-full aspect-[4/5] object-cover"
                            priority
                        />
                    )}
                </div>

                <div className="p-4 space-y-6">
                    {/* Compatibility Score Hero */}
                    {compatibility && (
                        <Card className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
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
                            {(profile as any).quizArchetype && (
                                <Badge variant="secondary" className="rounded-full text-xs gap-1">
                                    <Sparkles className="h-3 w-3 text-primary" />
                                    {(profile as any).quizArchetype}
                                    {(profile as any).quizScore && ` · ${(profile as any).quizScore}`}
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {profile.city}
                            </p>
                        </div>
                    </div>

                    {profile.latestAnswer?.question && profile.latestAnswer?.answer && (
                        <Card className="rounded-3xl border border-primary/10 bg-primary/5">
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

                    <ProfileHighlights
                        bio={profile.bio}
                        interests={profile.interests}
                        values={profile.values}
                        lookingFor={profile.lookingFor}
                        musicGenres={profile.musicGenres}
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
                                <BadgeChipList items={profile.interests} type="interest" />
                            </div>
                        </div>
                    )}

                    {profile.values && profile.values.length > 0 && (
                        <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Valores</h3>
                                <BadgeChipList items={profile.values} type="value" />
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

                    {(profile as any).spotify && <SpotifySection spotify={(profile as any).spotify} />}

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
                    <div className="fixed bottom-20 left-0 right-0 z-40 p-4 bg-background/80 backdrop-blur-sm border-t pb-[env(safe-area-inset-bottom,0px)] md:sticky md:bottom-0 md:z-auto md:bg-transparent md:border-none md:p-0 md:mt-4 md:px-4 md:pb-0">
                        {isFromNewMatch ? (
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
                        ) : isFromRejected ? (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-3">
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="w-full min-h-[48px]"
                                    onClick={handleGiveSecondChance}
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Undo className="h-5 w-5 mr-2" />
                                    )}
                                    Dar una segunda oportunidad
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-3">
                                <Button
                                    size="lg"
                                    variant={isLiked ? "default" : "outline"}
                                    className="w-full min-h-[48px]"
                                    onClick={handleLike}
                                    disabled={isLiked || processing}
                                >
                                    {processing ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Heart
                                            className={cn("h-5 w-5 mr-2", isLiked && "fill-current")}
                                        />
                                    )}
                                    {isLiked ? "Ya te gusta" : "Me Gusta"}
                                </Button>
                                {hasExistingMatch && (
                                    <Button asChild size="lg" variant="default" className="w-full min-h-[48px]">
                                        <Link href={`/chat/${id}`}>
                                            <MessageSquare className="h-5 w-5 mr-2" /> Mensaje
                                        </Link>
                                    </Button>
                                )}
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className={cn(
                                        "w-full min-h-[48px] bg-gradient-to-r from-primary to-accent text-white",
                                        isSuperMatched && "animate-pulse"
                                    )}
                                    onClick={handleSuperMatch}
                                    disabled={isSuperMatched || processing}
                                    title="Super Like: destaca tu interés en la lista"
                                >
                                    {processing ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-5 w-5 mr-2" />
                                    )}
                                    {isSuperMatched ? "Super Like enviado" : "Super Like"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
