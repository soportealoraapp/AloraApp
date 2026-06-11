"use client";

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
    title: 'Verificación real',
    description: 'Cada perfil es verificado. Conoces personas reales, no bots.',
  },
  {
    icon: Sparkles,
    title: 'Descubrimiento gradual',
    description: 'Conoce a alguien paso a paso, con preguntas que importan.',
  },
  {
    icon: MessageCircle,
    title: 'Conversaciones que fluyen',
    description: 'Rompehelos personalizados para que nunca separes en blanco.',
  },
];

const stats = [
  { value: '10K+', label: 'Personas activas' },
  { value: '50K+', label: 'Matches creados' },
  { value: '4.8', label: 'Calificación promedio' },
];

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background">
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
          <Logo className="mb-6 h-20 w-20 text-primary" />
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
      <motion.section 
        className="w-full max-w-2xl px-4 pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.section>

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
              Miles de personas ya conectan en Alora
            </h2>
            <p className="text-muted-foreground mb-6">
              Únete a la comunidad de dating más auténtica de México.
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
          <a href="/terms" className="hover:underline">Términos</a>
          <a href="/privacy" className="hover:underline">Privacidad</a>
          <Link href="/support" className="hover:underline">Ayuda</Link>
          <Link href="/contact" className="hover:underline">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
