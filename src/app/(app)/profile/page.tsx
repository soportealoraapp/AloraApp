
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockUser } from "@/lib/mock-data";
import { CheckCircle, Settings, Bell, Shield, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import placeholderImages from '@/lib/placeholder-images.json';

export default function ProfilePage() {
  return (
    <div className="md:pl-60">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <h1 className="text-xl font-semibold md:text-2xl font-headline">Tu Perfil</h1>
        <Button asChild variant="ghost" size="icon">
          <Link href="/settings">
            <Settings className="h-5 w-5"/>
          </Link>
        </Button>
      </header>
      <main className="p-4 space-y-6">
        <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
                <Avatar className="w-24 h-24 text-4xl mb-4 border-4 border-primary/50">
                    <AvatarImage src={mockUser.photos[0]} alt={mockUser.name} data-ai-hint="person" />
                    <AvatarFallback>{mockUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold font-headline">{mockUser.name}, {mockUser.age}</h2>
                    {mockUser.isVerified && <CheckCircle className="h-6 w-6 text-primary" />}
                </div>
                <p className="text-muted-foreground mt-1">"{mockUser.status}"</p>

                <div className="mt-4 flex gap-2">
                    <Button asChild>
                        <Link href="/profile/edit">Editar Perfil</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href={`/profile/me`}>Ver Mi Perfil</Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
                <CardHeader><CardTitle className="text-lg">Intereses</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {mockUser.interests.map(i => <Badge key={i}>{i}</Badge>)}
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-lg">Valores</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                    {mockUser.values.map(v => <Badge variant="secondary" key={v}>{v}</Badge>)}
                </CardContent>
            </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuración de la Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <Link href="/settings/notifications">
              <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-muted-foreground" />
                  <span>Notificaciones</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Link>
            <Link href="/settings/privacy">
             <div className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary -mx-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-muted-foreground" />
                <span>Privacidad y Seguridad</span>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            </Link>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

    