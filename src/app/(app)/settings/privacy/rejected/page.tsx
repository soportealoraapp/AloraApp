"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserMinus, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";

export default function RejectedProfilesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [rejectedProfiles, setRejectedProfiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadRejectedProfiles() {
            if (!user) return;

            try {
                const prefsRef = doc(db, "preferences", user.uid);
                const prefsSnap = await getDoc(prefsRef);

                if (prefsSnap.exists()) {
                    const data = prefsSnap.data();
                    setRejectedProfiles(data.rejectedProfiles || []);
                }
            } catch (error) {
                console.error("Error loading rejected profiles:", error);
            } finally {
                setLoading(false);
            }
        }

        loadRejectedProfiles();
    }, [user]);

    const handleRemoveFromRejected = async (profileId: string) => {
        if (!user) return;

        try {
            const prefsRef = doc(db, "preferences", user.uid);
            await updateDoc(prefsRef, {
                rejectedProfiles: arrayRemove(profileId),
            });

            setRejectedProfiles(prev => prev.filter(id => id !== profileId));

            toast({
                title: "Perfil restaurado",
                description: "Volverá a aparecer en descubrir",
            });
        } catch (error) {
            console.error("Error removing from rejected:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo restaurar el perfil",
            });
        }
    };

    if (loading) {
        return (
            <div className="md:pl-60">
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </main>
            </div>
        );
    }

    return (
        <div className="md:pl-60">
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">
                    Perfiles Ocultos
                </h1>
            </header>

            <main className="p-4 space-y-4">
                {rejectedProfiles.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <UserMinus className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                No has rechazado ningún perfil
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    rejectedProfiles.map((profileId) => (
                        <Card key={profileId}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                        src="/placeholder.jpg"
                                        alt="Profile"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">
                                        Usuario #{profileId.slice(0, 8)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Perfil rechazado
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={`/profile/${profileId}?source=rejected`}>
                                            Ver Perfil
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleRemoveFromRejected(profileId)}
                                    >
                                        Restaurar
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
