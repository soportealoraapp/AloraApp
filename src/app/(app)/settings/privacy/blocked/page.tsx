
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockProfiles, type UserProfile } from '@/lib/mock-data';
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function BlockedContactsPage() {
    const router = useRouter();
    const { toast } = useToast();
    // In a real app, this list would come from a user's account data.
    const [blockedUsers, setBlockedUsers] = useState<UserProfile[]>([mockProfiles[2]]);

    const handleUnblock = (userId: string) => {
        const unblockedUser = blockedUsers.find(u => u.id === userId);
        if (unblockedUser) {
            setBlockedUsers(blockedUsers.filter(u => u.id !== userId));
            toast({
                title: 'Usuario Desbloqueado',
                description: `Ahora puedes volver a ver e interactuar con ${unblockedUser.name}.`,
            });
        }
    }

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Contactos Bloqueados</h1>
            </header>
            <main className="p-4">
                <Card>
                    <CardContent className="p-4">
                        {blockedUsers.length > 0 ? (
                            <div className="space-y-4">
                                {blockedUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between">
                                        <Link href={`/profile/${user.id}`} className="flex-grow">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border">
                                                    <AvatarImage src={user.photos[0]} alt={user.name} />
                                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.age} años</p>
                                                </div>
                                            </div>
                                        </Link>
                                        <Button variant="ghost" size="icon" onClick={() => handleUnblock(user.id)}>
                                            <UserPlus className="h-5 w-5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-muted-foreground">No tienes contactos bloqueados.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
