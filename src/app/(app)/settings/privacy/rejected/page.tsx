'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, UserX } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { useToast } from "@/hooks/use-toast";

export default function RejectedUsersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadBlockedUsers();
        }
    }, [user]);

    const loadBlockedUsers = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const response = await fetch('/api/safety/status');
            if (response.ok) {
                const data = await response.json();
                setBlockedUsers(data.blockedUsers || []);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (blockedId: string) => {
        if (!user) return;
        try {
            const response = await fetch('/api/safety/block', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedId })
            });
            if (!response.ok) throw new Error('Error al desbloquear');
            setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
            toast({ title: "Usuario desbloqueado" });
        } catch (error) {
            toast({ title: "Error", variant: "destructive" });
        }
    };

    return (
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Usuarios Bloqueados</h1>
            </header>

            <main className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : blockedUsers.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        <UserX className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No tienes usuarios bloqueados.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {blockedUsers.map(u => (
                            <Card key={u.id}>
                                <CardContent className="p-4 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
                                            {u.photos?.[0] && <SafeImage src={u.photos[0]} alt={u.displayName} fill className="object-cover" loading="lazy" />}
                                        </div>
                                        <div>
                                            <p className="font-medium">{u.displayName}</p>
                                            <p className="text-xs text-muted-foreground">Bloqueado</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => handleUnblock(u.id)}>
                                        Desbloquear
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
