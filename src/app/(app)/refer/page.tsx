"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Copy, Share2, Users, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { getReferralCode, generateReferralLink } from "@/server/actions/referral";
import { Loader2 } from "lucide-react";

export default function ReferPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const [referralCode, setReferralCode] = useState("");
    const [referralLink, setReferralLink] = useState("");
    const [loadingReferral, setLoadingReferral] = useState(true);

    useEffect(() => {
        if (user?.id) {
            setLoadingReferral(true);
            Promise.all([
                getReferralCode(user.id),
                generateReferralLink(user.id),
            ]).then(([code, link]) => {
                setReferralCode(code);
                setReferralLink(link);
            }).finally(() => setLoadingReferral(false));
        }
    }, [user?.id]);

    const copyCode = () => {
        navigator.clipboard.writeText(referralCode);
        toast({ title: "¡Copiado!", description: "Tu código de recomendación ha sido copiado." });
    };

    const copyLink = () => {
        navigator.clipboard.writeText(referralLink);
        toast({ title: "¡Copiado!", description: "Tu enlace de recomendación ha sido copiado." });
    };

    const shareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Únete a Alora",
                    text: "Únete a Alora y encuentra conexiones reales. Usa mi código: " + referralCode,
                    url: referralLink,
                });
            } catch {}
        } else {
            copyLink();
        }
    };

    return (
        <div>
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold md:text-2xl font-headline">Recomienda y Gana</h1>
            </header>
            <main className="p-4 space-y-6">
                <Card className="text-center">
                    <CardHeader>
                        <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center mb-4">
                            <Gift className="h-10 w-10 text-primary" />
                        </div>
                        <CardTitle className="text-2xl font-headline">Invita a tus Amigos, Gana Recompensas</CardTitle>
                        <CardDescription className="max-w-md mx-auto">
                            Ayúdanos a hacer crecer nuestra comunidad segura. Cuando tu amiga se una con tu código, ¡ambas obtienen una función premium gratis por 1 semana!
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loadingReferral ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Cargando...</span>
                            </div>
                        ) : (<>
                        <div className="max-w-sm mx-auto space-y-2">
                            <Label htmlFor="referral-code">Tu código de recomendación</Label>
                            <div className="flex space-x-2">
                                <Input id="referral-code" value={referralCode} readOnly className="font-mono font-bold" />
                                <Button size="icon" variant="outline" onClick={copyCode} aria-label="Copiar código">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="max-w-sm mx-auto space-y-2">
                            <Label htmlFor="referral-link">Enlace de invitación</Label>
                            <div className="flex space-x-2">
                                <Input id="referral-link" value={referralLink} readOnly className="text-xs break-all" />
                                <Button size="icon" variant="outline" onClick={copyLink} aria-label="Copiar enlace">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-center">
                            <Button onClick={shareLink} className="gap-2">
                                <Share2 className="h-4 w-4" /> Compartir
                            </Button>
                        </div>

                        <div className="bg-muted/50 rounded-2xl p-4 space-y-3 text-left">
                            <h4 className="font-bold text-sm flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> ¿Cómo funciona?
                            </h4>
                            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                                <li>Comparte tu código o enlace con tus amigas</li>
                                <li>Ella se registra usando tu código</li>
                                <li>Ambas reciben 1 semana de Alora Plus gratis</li>
                            </ol>
                        </div>
                        </>)}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
