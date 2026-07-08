"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBlock } from "@/hooks/use-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircle, ArrowLeft, UserX, RefreshCw } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { Skeleton } from "@/components/ui/skeleton";
import { BRAND_VOICE } from "@/lib/constants/brand-voice";

export default function BlockedUsersPage() {
    const router = useRouter();
    const { blockedUsers, loading, error, refetch, unblockUser } = useBlock();
    const [unblockTarget, setUnblockTarget] = useState<string | null>(null);

    if (loading) {
        return (
            <div>
                <header className="app-page-header gap-4 sm:px-6">
                    <Skeleton className="h-8 w-48" />
                </header>
                <main className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <header className="app-page-header gap-4 sm:px-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-xl font-semibold md:text-2xl font-headline">
                        Contactos Bloqueados
                    </h1>
                </header>
                <main className="p-4 space-y-4">
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                            <p className="text-destructive font-medium text-center">
                                {error}
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => refetch()}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reintentar
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div>
            <header className="app-page-header gap-4 sm:px-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
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
                                    <SafeImage
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
                                        Bloqueado el {block.createdAt ? new Date(block.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                                <AlertDialog open={unblockTarget === block.blockedId} onOpenChange={(open) => !open && setUnblockTarget(null)}>
                                    <Button
                                        variant="outline"
                                        onClick={() => setUnblockTarget(block.blockedId)}
                                    >
                                        Desbloquear
                                    </Button>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Desbloquear a esta persona?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción desbloqueará a {block.displayName || `Usuario #${block.blockedId.slice(0, 8)}`} y podrá volver a interactuar contigo.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => unblockUser(block.blockedId)}>
                                                Desbloquear
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardContent>
                        </Card>
                    ))
                )}
            </main>
        </div>
    );
}
