

"use client";

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { mockProfiles, mockUser, icebreakers, mockChats, type ChatConversation } from '@/lib/mock-data';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CheckCircle, Heart, MessageSquare, Sparkles, MapPin, Briefcase, Cigarette, GlassWater, Baby, Star, BookOpen, Music, X, Undo, UserCheck } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import placeholderImages from '@/lib/placeholder-images.json';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";

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
    const { id } = params;
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [isSuperMatched, setIsSuperMatched] = useState(false);

    const source = searchParams.get('source');
    const isFromNewMatch = source === 'new-match';
    const isFromRejected = source === 'rejected';

    const profile = id === 'me' ? mockUser : mockProfiles.find(p => p.id === id);

    if (!profile) {
        return <div className="h-screen flex items-center justify-center md:pl-60">Perfil no encontrado.</div>;
    }
    
    const mainPhoto = profile.photos[0];
    const photoGallery = profile.photos.slice(1);

    const details = [
        { label: 'Ubicación', value: profile.city, icon: 'city' },
        { label: 'Signo', value: profile.zodiacSign, icon: 'zodiacSign' },
        { label: 'Educación', value: profile.education, icon: 'education' },
        { label: 'Tabaco', value: profile.smoking, icon: 'smoking' },
        { label: 'Alcohol', value: profile.drinking, icon: 'drinking' },
        { label: 'Hijos', value: profile.children, icon: 'children' },
        { label: 'Religión', value: profile.religion, icon: 'religion' },
    ].filter(detail => detail.value);

    const handleLike = () => {
        setIsLiked(true);
        toast({
            title: `Te ha gustado ${profile.name} ✨`,
            description: "¡Ojalá hagan match! Te notificaremos.",
        });
    }

    const handleSuperMatch = () => {
        setIsSuperMatched(true);
        setIsLiked(true); // A super match is also a like
        
        // Select a random icebreaker
        const allIcebreakers = Object.values(icebreakers).flat();
        const randomIcebreaker = allIcebreakers[Math.floor(Math.random() * allIcebreakers.length)];

        // In a real app, you would send this to the other user.
        // We'll simulate with a toast.
        toast({
            title: `¡Super Match con ${profile.name}! 🚀`,
            description: `Le has enviado un rompehielos para empezar: "${randomIcebreaker}"`,
            duration: 5000,
        });
    }

    const handleAcceptMatch = () => {
        // In a real app, you'd update state globally
        toast({
            title: `¡Nuevo match con ${profile.name}! 🎉`,
            description: `Ahora podéis chatear.`,
        });
        router.push(`/chat/${profile.id}`);
    }

    const handleDeclineMatch = () => {
         // In a real app, you'd update state globally
        router.back();
    }

    const handleGiveSecondChance = () => {
        toast({
            title: '¡Nuevo Match!',
            description: `Has hecho match con ${profile.name} después de todo. ¡A chatear!`,
        });
        router.push(`/chat/${profile.id}`);
    }


    return (
        <div className="md:pl-60">
             <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex items-center gap-2">
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">{profile.name}</h1>
                    {profile.isVerified && <CheckCircle className="h-5 w-5 text-primary" />}
                </div>
            </header>
            <main className="pb-24 md:pb-4">
                <div className="w-full relative">
                    <Image
                        src={mainPhoto}
                        alt={`Foto de ${profile.name}`}
                        width={600}
                        height={800}
                        className="w-full aspect-[3/4] object-cover"
                        data-ai-hint="person"
                        priority
                    />
                </div>
                
                <div className="p-4 space-y-6">
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h2 className="text-3xl font-bold font-headline">{profile.name}, {profile.age}</h2>
                            {profile.isVerified && <CheckCircle className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="flex items-center gap-4 text-muted-foreground mt-2">
                            <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> {profile.city}
                            </p>
                            {id !== 'me' && (
                                <div className="flex items-center gap-2 font-semibold text-pink-500">
                                    <Sparkles className="h-4 w-4"/>
                                    <span>{ (profile as any).compatibility }% Compatible</span>
                                </div>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-2 text-lg">"{profile.status}"</p>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                        </CardContent>
                    </Card>

                    {profile.personalGuide && profile.personalGuide.length > 0 && (
                        <Card>
                           <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCheck className="h-5 w-5"/> Guía Personal</CardTitle></CardHeader>
                            <CardContent className="space-y-2">
                                {profile.personalGuide.map(guide => (
                                    <div key={guide.title} className="p-3 rounded-lg bg-secondary">
                                        <p className="font-semibold text-sm">{guide.title}</p>
                                        <p className="text-xs text-muted-foreground">{guide.description}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {details.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Más sobre {profile.name.split(' ')[0]}</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                {details.map(detail => {
                                    const Icon = detailIcons[detail.icon];
                                    return (
                                    <div key={detail.label} className="flex items-center gap-3 text-sm">
                                        {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
                                        <div className="flex flex-col">
                                            <span className="font-semibold">{detail.value}</span>
                                            <span className="text-xs text-muted-foreground">{detail.label}</span>
                                        </div>
                                    </div>
                                )})}
                            </CardContent>
                        </Card>
                    )}


                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Intereses</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.interests.map(i => <Badge key={i}>{i}</Badge>)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Valores</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.values.map(v => <Badge variant="secondary" key={v}>{v}</Badge>)}
                            </CardContent>
                        </Card>
                    </div>

                    {profile.musicGenres && profile.musicGenres.length > 0 && (
                         <Card>
                            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Music className="h-5 w-5"/> Gustos Musicales</CardTitle></CardHeader>
                            <CardContent className="flex flex-wrap gap-2">
                                {profile.musicGenres.map(genre => <Badge key={genre} variant="outline">{genre}</Badge>)}
                            </CardContent>
                        </Card>
                    )}


                    {photoGallery.length > 0 && (
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Galería</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-3 gap-2">
                                {photoGallery.map((photo, index) => (
                                     <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                                        <Image
                                            src={photo}
                                            alt={`Galería de ${profile.name} ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            data-ai-hint="person"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {id !== 'me' && (
                     <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-sm border-t md:relative md:bg-transparent md:border-none md:p-0 md:mt-4 md:px-4">
                        {isFromNewMatch ? (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button size="lg" variant="outline" className="w-full" onClick={handleDeclineMatch}>
                                    <X className="h-5 w-5 mr-2" /> Rechazar
                                </Button>
                                <Button size="lg" variant="default" className="w-full" onClick={handleAcceptMatch}>
                                    <Heart className="h-5 w-5 mr-2 fill-current" /> Hacer Match
                                </Button>
                            </div>
                        ) : isFromRejected ? (
                             <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button size="lg" variant="default" className="w-full" onClick={handleGiveSecondChance}>
                                    <Undo className="h-5 w-5 mr-2" /> Dar una segunda oportunidad
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-around items-center max-w-md mx-auto gap-2">
                                <Button size="lg" variant={isLiked ? "default" : "outline"} className="w-full" onClick={handleLike} disabled={isLiked}>
                                    <Heart className={cn("h-5 w-5 mr-2", isLiked && "fill-current")} /> Me Gusta
                                </Button>
                                <Button asChild size="lg" variant="default" className="w-full">
                                    <Link href={`/chat/${id}`}>
                                        <MessageSquare className="h-5 w-5 mr-2" /> Mensaje
                                    </Link>
                                </Button>
                                <Button size="lg" variant="secondary" className={cn("w-full bg-gradient-to-r from-pink-500 to-violet-500 text-white", isSuperMatched && "animate-pulse")} onClick={handleSuperMatch} disabled={isSuperMatched}>
                                    <Sparkles className="h-5 w-5 mr-2"/> Super Match
                                </Button>
                            </div>
                        )}
                    </div>
                )}

            </main>
        </div>
    );

    
}
