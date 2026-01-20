
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, MessageSquare, Puzzle, User, Compass, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Logo } from '../logo';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Descubrir' },
  { href: '/compatibility', icon: Puzzle, label: 'Compatibilidad' },
  { href: '/chat', icon: MessageSquare, label: 'Chat' },
  { href: '/refer', icon: Star, label: 'Recomendar' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-md md:hidden pb-safe">
        <div className="flex justify-around items-stretch h-16">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <Icon className={cn("h-6 w-6 transition-all", isActive ? "scale-110" : "")} />
                  <span className={cn("text-[10px] font-bold tracking-tight uppercase", isActive ? "opacity-100" : "opacity-70")}>
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar for Desktop */}
      <nav className="hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:z-10 md:flex md:w-60 md:flex-col md:border-r">
        <div className="flex h-20 items-center px-6">
          <Link href="/discover" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl">Alora</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-4">
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-secondary hover:text-primary',
                    pathname.startsWith(href) ? 'bg-primary/10 text-primary' : ''
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main content offset for desktop sidebar */}
      <div className="hidden md:block md:pl-60">
        {/* Children will be rendered here by Next.js layout system */}
      </div>
    </>
  );
}
