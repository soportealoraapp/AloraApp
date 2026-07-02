"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Heart, Shield, Sparkles, MessageCircle, Users, ArrowRight } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';

const pillars = [
  {
    icon: Shield,
    title: 'Perfiles verificados',
    description: 'Opcional. Verifica tu perfil para destacar y generar más confianza.',
  },
  {
    icon: Sparkles,
    title: 'Descubrimiento gradual',
    description: 'Conoce a alguien paso a paso, con preguntas que importan.',
  },
  {
    icon: MessageCircle,
    title: 'Conversaciones que fluyen',
    description: 'Rompehielos personalizados para que nunca te quedes en blanco.',
  },
];

interface PublicStats {
  activeUsers: number;
  totalMatches: number;
  totalLikes: number;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString('es-MX');
}

export default function WelcomePage() {
  const [stats, setStats] = useState<PublicStats | null>(null);
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/stats')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setStats(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStatsLoaded(true);
      });
    return () => { cancelled = true; };
  }, []);

  const displayStats = stats
    ? [
        { value: formatCount(stats.activeUsers), label: 'Personas activas' },
        { value: formatCount(stats.totalMatches), label: 'Matches creados' },
        { value: formatCount(stats.totalLikes), label: 'Likes enviados' },
      ]
    : null;

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/" aria-label="Alora — Inicio">
            <Logo className="mb-6 h-20 w-20 text-primary" />
          </Link>
        </motion.div>
        
        <motion.h1 
          className="font-headline text-5xl md:text-6xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Alora
        </motion.h1>
        
        <motion.p 
          className="mt-4 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Dating con intención. Conecta con personas reales a través de historias, valores y momentos compartidos.
        </motion.p>

        <motion.div 
          className="mt-10 flex flex-col gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button asChild size="lg" className="font-bold px-8 h-14 text-base rounded-full shadow-lg hover:shadow-xl transition-all">
            <Link href="/signup">
              Crear Cuenta
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="font-bold px-8 h-14 text-base rounded-full">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </motion.div>
      </main>

      {/* Stats */}
      {displayStats && (
        <motion.section
          className="w-full max-w-2xl px-4 pb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="grid grid-cols-3 gap-4">
            {displayStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary">
                  {statsLoaded ? stat.value : <span className="inline-block w-16 h-7 bg-muted animate-pulse rounded" />}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* 3 Pillars */}
      <section className="w-full max-w-3xl px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            >
              <Card className="rounded-2xl border-none bg-muted/30 shadow-sm h-full">
                <CardContent className="p-6 text-center">
                  <div className="bg-primary/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <pillar.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section 
        className="w-full max-w-2xl px-4 pb-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <Card className="rounded-2xl border-none bg-primary/5">
          <CardContent className="p-8">
            <Users className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {stats && stats.activeUsers > 0
                ? `Únete a ${formatCount(stats.activeUsers)}+ personas en Alora`
                : 'Sé de las primeras personas en Alora'}
            </h2>
            <p className="text-muted-foreground mb-6">
              Conecta con personas que buscan algo real y auténtico.
            </p>
            <Button asChild size="lg" className="font-bold px-8 h-12 rounded-full">
              <Link href="/signup">Empezar ahora</Link>
            </Button>
          </CardContent>
        </Card>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 text-center space-y-3 w-full border-t border-border/50">
        <p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          Hecho con <Heart className="h-4 w-4 text-primary fill-primary" /> para una comunidad más segura.
        </p>
        <div className="text-xs text-muted-foreground space-x-4">
          <Link href="/terms" className="hover:underline" prefetch={false}>Términos</Link>
          <Link href="/privacy" className="hover:underline" prefetch={false}>Privacidad</Link>
          <Link href="/support" className="hover:underline" prefetch={false}>Ayuda</Link>
          <Link href="/contact" className="hover:underline" prefetch={false}>Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
