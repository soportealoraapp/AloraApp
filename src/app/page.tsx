"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Heart, Shield, Sparkles, MessageCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';

const pillars = [
  {
    icon: Shield,
    title: 'Verificación real',
    description: 'Cada perfil es verificado manualmente. Conoces a personas reales, no bots.',
  },
  {
    icon: Sparkles,
    title: 'Descubrimiento gradual',
    description: 'Sin presión. Conoce a alguien paso a paso, a tu ritmo, con preguntas que importan.',
  },
  {
    icon: MessageCircle,
    title: 'Conversaciones que fluyen',
    description: 'Rompehelos personalizados y guías de conversación para que nunca separes en blanco.',
  },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20">
        <Logo className="mb-6 h-20 w-20 text-primary" />
        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-foreground">
          Alora
        </h1>
        <p className="mt-4 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed">
          Dating con intención. Conecta con personas reales a través de historias, valores y momentos compartidos.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="font-bold px-8 h-14 text-base rounded-full shadow-lg hover:shadow-xl transition-all">
            <Link href="/signup">Crear Cuenta</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="font-bold px-8 h-14 text-base rounded-full">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </main>

      {/* 3 Pillars */}
      <section className="w-full max-w-3xl px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <Card key={pillar.title} className="rounded-3xl border-none bg-muted/30 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <pillar.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{pillar.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full max-w-2xl px-4 pb-20 text-center">
        <Card className="rounded-3xl border-none bg-muted/20">
          <CardContent className="p-8">
            <p className="text-lg text-foreground italic leading-relaxed mb-4">
              &ldquo;En Alora no swipes rápido. Lees, piensas, sientes. Y cuando conectas, es real.&rdquo;
            </p>
            <p className="text-sm text-muted-foreground font-medium">— Mariana, 28, Ciudad de México</p>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center space-y-3 w-full border-t border-border/50">
        <p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          Hecho con <Heart className="h-4 w-4 text-primary fill-primary" /> para una comunidad más segura.
        </p>
        <div className="text-xs text-muted-foreground space-x-4">
          <a href="/terms" className="hover:underline">Términos</a>
          <a href="/privacy" className="hover:underline">Privacidad</a>
          <Link href="/support" className="hover:underline">Ayuda</Link>
          <Link href="/contact" className="hover:underline">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
