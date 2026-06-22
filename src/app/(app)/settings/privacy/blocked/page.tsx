"use client";

import { useRouter } from "next/navigation";
import { useBlock } from "@/hooks/use-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, UserX } from "lucide-react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";

export default function BlockedUsersPage() {
    const router = useRouter();
    const { blockedUsers, loading, unblockUser } = useBlock();

    if (loading) {
        return (
            <div>
                <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </main>
            </div>
        );
    }

    return (
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">
                    Contactos Bloqueados
                </h1>
            </header>

            <main className="p-4 space-y-4">
                {blockedUsers.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <UserX className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-center">
                                {BRAND_VOICE.states.noBlockedUsers.title}
                            </p>
                            <p className="text-sm text-muted-foreground text-center mt-1">
                                {BRAND_VOICE.states.noBlockedUsers.subtitle}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    blockedUsers.map((block) => (
                        <Card key={block.id}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                                    <Image
                                        src={block.photoUrl || "/placeholder.svg"}
                                        alt={block.displayName || "Profile"}
                                        fill
                                        className="object-cover"
                                        loading="lazy"
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">
                                        {block.displayName || `Usuario #${block.blockedId.slice(0, 8)}`}
                                    </p>
                                    {block.reason && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            Razón: {block.reason}
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Bloqueado el {new Date(block.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => unblockUser(block.blockedId)}
                                >
                                    Desbloquear
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
