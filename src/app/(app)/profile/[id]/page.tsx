"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/use-profile";
import { useMatches } from "@/hooks/use-matches";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Heart, MessageSquare, Sparkles, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, X, Undo, UserCheck, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { ProfileHighlights } from "@/components/profile/ProfileHighlights";
import { FavoriteButton } from "@/components/profile/FavoriteButton";
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

    const source = searchParams.get("source");
    const isFromNewMatch = source === "new-match";
    const isFromRejected = source === "rejected";

    const { profile, loading } = useProfile(id as string);

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
    const photoGallery = profile.photos?.slice(1) || [];

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
            const result = await sendLike(profile.id, "like");
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
        } finally {
            setProcessing(false);
        }
    };

    const handleSuperMatch = async () => {
        if (isSuperMatched || processing) return;

        setProcessing(true);
        try {
            const result = await sendLike(profile.id, "superlike");
            setIsSuperMatched(true);
            setIsLiked(true);

            if (result.matched) {
                toast({
                    title: `¡Flechado con ${profile.displayName}! 🚀`,
                    description: "Conexión especial - Ahora pueden chatear",
                    duration: 5000,
                });
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error enviando flechado:", error);
        } finally {
            setProcessing(false);
        }
    };

    const handleAcceptMatch = async () => {
        setProcessing(true);
        try {
            const result = await sendLike(profile.id, "like");

            toast({
                title: `¡Nuevo match con ${profile.displayName}! 🎉`,
                description: "Ahora podéis chatear",
            });

            if (result.matchId) {
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error accepting match:", error);
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
            const result = await sendLike(profile.id, "like");

            toast({
                title: "¡Segunda oportunidad!",
                description: `Has hecho match con ${profile.displayName}`,
            });

            if (result.matchId) {
                router.push(`/chat/${result.matchId}`);
            }
        } catch (error) {
            console.error("Error giving second chance:", error);
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
                    {profile.isVerified && <CheckCircle className="h-5 w-5 text-primary" />}
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
                                        <div className="w-full aspect-[3/4] relative">
                                            <Image
                                                src={photo}
                                                alt={`Foto de ${profile.displayName} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="person"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious className="left-2" />
                            <CarouselNext className="right-2" />
                        </Carousel>
                    ) : (
                        <Image
                            src={mainPhoto}
                            alt={`Foto de ${profile.displayName}`}
                            width={600}
                            height={800}
                            className="w-full aspect-[3/4] object-cover"
                            data-ai-hint="person"
                            priority
                        />
                    )}
                </div>

                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold font-headline">
                                {profile.displayName}, {profile.age}
                            </h2>
                            {profile.isVerified && (
                                <CheckCircle className="h-6 w-6 text-primary" />
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {profile.city}
                            </p>
                        </div>
                        {profile.status && (
                            <p className="text-muted-foreground mt-2 text-lg">
                                "{profile.status}"
                            </p>
                        )}
                    </div>

                    {profile.bio && (
                        <Card>
                            <CardContent className="p-6">
                                <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
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

                    {details.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-4">
                                    Más sobre {profile.displayName.split(" ")[0]}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.interests && profile.interests.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-lg mb-3">Intereses</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.interests.map((i) => (
                                            <Badge key={i}>{i}</Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {profile.values && profile.values.length > 0 && (
                            <Card>
                                <CardContent className="p-6">
                                    <h3 className="font-semibold text-lg mb-3">Valores</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {profile.values.map((v) => (
                                            <Badge variant="secondary" key={v}>
                                                {v}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {profile.musicGenres && profile.musicGenres.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg flex items-center gap-2 mb-3">
                                    <Music className="h-5 w-5" /> Gustos Musicales
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.musicGenres.map((genre) => (
                                        <Badge key={genre} variant="outline">
                                            {genre}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {photoGallery.length > 0 && (
                        <Card>
                            <CardContent className="p-6">
                                <h3 className="font-semibold text-lg mb-3">Galería</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {photoGallery.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square relative rounded-lg overflow-hidden"
                                        >
                                            <Image
                                                src={photo}
                                                alt={`Galería de ${profile.displayName} ${index + 1}`}
                                                fill
                                                className="object-cover"
                                                data-ai-hint="person"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {id !== user?.id && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-t md:relative md:bg-transparent md:border-none md:p-0 md:mt-4 md:px-4">
                        {isFromNewMatch ? (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleDeclineMatch}
                                    disabled={processing}
                                >
                                    <X className="h-5 w-5 mr-2" /> Rechazar
                                </Button>
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="w-full"
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
                            <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button
                                    size="lg"
                                    variant="default"
                                    className="w-full"
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
                            <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button
                                    size="lg"
                                    variant={isLiked ? "default" : "outline"}
                                    className="w-full"
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
                                    {isLiked ? "Liked" : "Me Gusta"}
                                </Button>
                                <Button asChild size="lg" variant="default" className="w-full">
                                    <Link href={`/chat/${id}`}>
                                        <MessageSquare className="h-5 w-5 mr-2" /> Mensaje
                                    </Link>
                                </Button>
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className={cn(
                                        "w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white",
                                        isSuperMatched && "animate-pulse"
                                    )}
                                    onClick={handleSuperMatch}
                                    disabled={isSuperMatched || processing}
                                >
                                    {processing ? (
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                    ) : (
                                        <Sparkles className="h-5 w-5 mr-2" />
                                    )}
                                    {isSuperMatched ? "Flechado Enviado" : "Flechado"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
