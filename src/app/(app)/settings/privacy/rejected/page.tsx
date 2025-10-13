

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { mockProfiles, type UserProfile, mockChats, type ChatConversation } from '@/lib/mock-data';
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getRejectedProfilesFromStorage, saveRejectedProfilesToStorage } from '@/lib/storage';


export default function RejectedProfilesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [rejectedProfiles, setRejectedProfiles] = useState<UserProfile[]>([]);

    useEffect(() => {
        setRejectedProfiles(getRejectedProfilesFromStorage());
    }, []);

    const handleGiveSecondChance = (profileId: string) => {
        const unblockedProfile = rejectedProfiles.find(p => p.id === profileId);
        if (!unblockedProfile) return;

        const updatedProfiles = rejectedProfiles.filter(p => p.id !== profileId);
        setRejectedProfiles(updatedProfiles);
        saveRejectedProfilesToStorage(updatedProfiles);
        
        toast({
            title: '¡Nuevo Match!',
            description: `Has hecho match con ${unblockedProfile.name} después de todo. ¡A chatear!`,
        });
        // Here you would add to the actual chats list, for now, we just navigate
        // In a real app, this would also add a new ChatConversation to your global state
        router.push(`/chat/${unblockedProfile.id}`);
    }

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Perfiles Ocultos</h1>
            </header>
            <main className="p-4">
                <Card>
                    <CardContent className="p-4">
                        {rejectedProfiles.length > 0 ? (
                             <div className="space-y-4">
                                {rejectedProfiles.map(profile => (
                                    profile && (
                                        <div key={profile.id} className="flex items-center justify-between">
                                            <Link href={`/profile/${profile.id}?source=rejected`} className="flex-grow">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12 border">
                                                        <AvatarImage src={profile.photos[0]} alt={profile.name} />
                                                        <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{profile.name}</p>
                                                        <p className="text-sm text-muted-foreground">{profile.age} años</p>
                                                    </div>
                                                </div>
                                            </Link>
                                            <Button variant="ghost" size="icon" onClick={() => handleGiveSecondChance(profile.id)}>
                                                <UserPlus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    )
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No has ocultado ningún perfil.</p>
                                <p className="text-sm text-muted-foreground">Cuando rechaces un match, aparecerá aquí.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
