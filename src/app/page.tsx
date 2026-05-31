
"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Heart } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';


export default function WelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex flex-1 flex-col items-center justify-center text-center">
        <Logo className="mb-6 h-24 w-24 text-primary" />
        <h1 className="font-headline text-5xl font-bold tracking-tight text-foreground">
          Alora
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted-foreground">
          Tu espacio seguro para conocer a alguien especial.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Button asChild size="lg" className="font-bold">
            <Link href="/signup">Crear Cuenta</Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="font-bold">
            <Link href="/login">Iniciar Sesión</Link>
          </Button>
        </div>
      </main>
      <footer className="py-6 text-center space-y-2">
        <p className="flex items-center justify-center gap-2 text-muted-foreground">
          Hecho con <Heart className="h-4 w-4 text-primary" /> para una comunidad más segura.
        </p>
        <div className="text-[10px] text-muted-foreground space-x-3">
          <a href="https://docs.google.com/document/d/1dFjQ4aZqW2t9hVv0n8v7b3x9kLmZqYjR/edit" target="_blank" rel="noopener noreferrer" className="hover:underline">Términos</a>
          <a href="https://docs.google.com/document/d/1dFjQ4aZqW2t9hVv0n8v7b3x9kLmZqYjR/edit" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacidad</a>
          <Link href="/support" className="hover:underline">Ayuda</Link>
          <Link href="/contact" className="hover:underline">Contacto</Link>
        </div>
      </footer>
    </div>
  );
}
