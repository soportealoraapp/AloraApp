
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ReferPage() {
    const referralCode = "ALORA-AMIGA-2024";
    const { toast } = useToast();

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralCode);
        toast({
            title: "¡Copiado!",
            description: "Tu código de recomendación ha sido copiado.",
        });
    }

  return (
    <div className="md:pl-60">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Recomienda y Gana</h1>
      </header>
      <main className="p-4 space-y-6">
        <Card className="text-center">
            <CardHeader>
                 <div className="mx-auto bg-primary/10 rounded-full h-20 w-20 flex items-center justify-center mb-4">
                    <Gift className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-2xl font-headline">Invita a tus Amigas, Gana Recompensas</CardTitle>
                <CardDescription className="max-w-md mx-auto">
                    Ayúdanos a hacer crecer nuestra comunidad segura. Cuando tu amiga se una con tu código, ¡ambas obtienen una función premium gratis durante un mes!
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-w-sm mx-auto space-y-2">
                    <Label htmlFor="referral-code">Tu código de recomendación único</Label>
                    <div className="flex space-x-2">
                        <Input id="referral-code" value={referralCode} readOnly />
                        <Button size="icon" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
