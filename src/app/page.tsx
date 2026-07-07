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
    color: 'from-emerald-500/20 to-teal-500/10',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/10',
  },
  {
    icon: Sparkles,
    title: 'Descubrimiento gradual',
    description: 'Conoce a alguien paso a paso, con preguntas que importan.',
    color: 'from-primary/20 to-violet-500/10',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
  },
  {
    icon: MessageCircle,
    title: 'Conversaciones que fluyen',
    description: 'Rompehielos personalizados para que nunca te quedes en blanco.',
    color: 'from-blue-500/20 to-indigo-500/10',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-500/10',
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
    const controller = new AbortController();
    fetch('/api/public/stats', { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setStats(data);
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoaded(true));
    return () => controller.abort();
  }, []);

  const displayStats = stats
    ? [
        { value: formatCount(stats.activeUsers), label: 'Personas activas' },
        { value: formatCount(stats.totalMatches), label: 'Matches creados' },
        { value: formatCount(stats.totalLikes), label: 'Likes enviados' },
      ]
    : null;

  return (
    <div className="flex min-h-dvh w-full flex-col items-center bg-background relative overflow-x-hidden">
      {/* Decorative background blobs */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] opacity-60"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% -5%, hsl(335 85% 76% / 0.22) 0%, transparent 70%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-0 w-[400px] h-[400px]"
        style={{
          background: 'radial-gradient(circle at 80% 50%, hsl(280 60% 70% / 0.14) 0%, transparent 65%)',
        }}
      />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center text-center px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 180, damping: 24 }}
          className="mb-6"
        >
          <Link href="/" aria-label="Alora — Inicio">
            <div
              className="h-24 w-24 rounded-3xl flex items-center justify-center mx-auto animate-float"
              style={{
                background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)',
                boxShadow: '0 8px 32px hsl(335 85% 76% / 0.5), 0 2px 8px hsl(280 60% 70% / 0.3)',
              }}
            >
              <Logo className="h-14 w-14 text-white" />
            </div>
          </Link>
        </motion.div>

        <motion.h1
          className="font-headline text-6xl md:text-7xl font-bold tracking-tight text-gradient"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Alora
        </motion.h1>

        <motion.p
          className="mt-5 max-w-lg text-lg md:text-xl text-muted-foreground leading-relaxed"
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
          <Button asChild size="lg" className="font-bold px-10 h-14 text-base rounded-full">
            <Link href="/signup">
              Crear Cuenta
              <ArrowRight className="h-5 w-5 ml-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="font-bold px-10 h-14 text-base rounded-full border-primary/30 hover:border-primary/60"
          >
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </motion.div>
      </main>

      {/* Stats */}
      {statsLoaded && (
        <motion.section
          className="w-full max-w-2xl px-4 pb-16 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div
            className="grid grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-border/40"
            style={{
              background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.06) 0%, hsl(280 60% 70% / 0.04) 100%)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {displayStats
              ? displayStats.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={`text-center py-5 px-4 ${i < 2 ? 'border-r border-border/40' : ''}`}
                  >
                    <p className="text-2xl md:text-3xl font-bold text-gradient">
                      {stat.value}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))
              : [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`text-center py-5 px-4 ${i < 2 ? 'border-r border-border/40' : ''}`}
                  >
                    <div className="h-7 w-16 bg-muted animate-pulse rounded mx-auto mb-2" />
                    <div className="h-3 w-20 bg-muted/60 animate-pulse rounded mx-auto" />
                  </div>
                ))}
          </div>
        </motion.section>
      )}

      {/* 3 Pillars */}
      <section className="w-full max-w-3xl px-4 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
            >
              <Card
                className="rounded-2xl border border-border/40 h-full transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)`,
                }}
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-70"
                  style={{
                    background: `linear-gradient(135deg, ${pillar.color.replace('from-', '').replace('to-', '')})`,
                  }}
                />
                <CardContent className="p-6 text-center relative z-10">
                  <div
                    className={`w-13 h-13 rounded-2xl flex items-center justify-center mx-auto mb-4 ${pillar.iconBg}`}
                    style={{ width: '52px', height: '52px' }}
                  >
                    <pillar.icon className={`h-6 w-6 ${pillar.iconColor}`} />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-base">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section
        className="w-full max-w-2xl px-4 pb-20 text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <div
          className="rounded-3xl p-8 border border-primary/20 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.08) 0%, hsl(280 60% 70% / 0.06) 100%)',
          }}
        >
          {/* Decorative glow */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 opacity-60"
            style={{
              background: 'radial-gradient(ellipse, hsl(335 85% 76% / 0.3) 0%, transparent 70%)',
            }}
          />
          <div className="relative z-10">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.2) 0%, hsl(280 60% 70% / 0.15) 100%)',
              }}
            >
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-headline text-foreground mb-3">
              {stats && stats.activeUsers > 0
                ? `Únete a ${formatCount(stats.activeUsers)}+ personas en Alora`
                : 'Sé de las primeras personas en Alora'}
            </h2>
            <p className="text-muted-foreground mb-7 leading-relaxed">
              Conecta con personas que buscan algo real y auténtico.
            </p>
            <Button asChild size="lg" className="font-bold px-10 h-13 rounded-full">
              <Link href="/signup">Empezar ahora</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-8 text-center space-y-3 w-full relative z-10">
        <div className="separator-gradient mx-8 mb-6" />
        <p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
          Hecho con <Heart className="h-4 w-4 text-primary fill-primary" /> para una comunidad más segura.
        </p>
        <div className="text-xs text-muted-foreground/70 space-x-4">
          <Link href="/terms" className="hover:text-foreground transition-colors" prefetch={false}>Términos</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors" prefetch={false}>Privacidad</Link>
          <Link href="/support" className="hover:text-foreground transition-colors" prefetch={false}>Ayuda</Link>
          <Link href="/contact" className="hover:text-foreground transition-colors" prefetch={false}>Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
