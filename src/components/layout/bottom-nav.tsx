'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, User, Compass, Bell, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Logo } from '../logo';
import { useNotifications } from '@/hooks/use-notifications';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Descubrir' },
  { href: '/chat', icon: MessageSquare, label: 'Mensajes' },
  { href: '/compatibility', icon: Sparkles, label: 'Almas', special: true },
  { href: '/notifications', icon: Bell, label: 'Actividad' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications({ pollIntervalMs: 30000 });

  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl md:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ href, icon: Icon, label, special }) => {
            const isActive = pathname.startsWith(href);
            const showBadge = href === '/notifications' && unreadCount > 0;
            
            if (special) {
              return (
                <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center relative -top-3">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="flex flex-col items-center"
                  >
                    <div className={cn(
                      "relative h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all border-4 border-background",
                      isActive 
                        ? "bg-primary text-primary-foreground scale-110 shadow-primary/30" 
                        : "bg-gradient-to-tr from-primary/80 to-purple-500/80 text-white"
                    )}>
                      <Icon className="h-7 w-7" />
                      {isActive && (
                        <motion.div
                          layoutId="active-special"
                          className="absolute -inset-1 rounded-full border-2 border-primary animate-pulse"
                        />
                      )}
                    </div>
                    <span className={cn(
                      "text-[10px] font-black tracking-widest uppercase mt-1 transition-all",
                      isActive ? "text-primary scale-110" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center relative">
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-6 w-6 transition-all", isActive ? "scale-110" : "")} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
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
      <nav className="hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:z-10 md:flex md:w-60 md:flex-col md:border-r" aria-label="Navegación principal">
        <div className="flex h-20 items-center px-6">
          <Link href="/discover" className="flex items-center gap-2 font-semibold">
            <Logo className="h-8 w-8 text-primary" />
            <span className="font-headline text-2xl">Alora</span>
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2 p-4">
            {navItems.map(({ href, icon: Icon, label, special }) => {
              const isActive = pathname.startsWith(href);
              const showBadge = href === '/notifications' && unreadCount > 0;
              return (
                <Link key={href} href={href}>
                  <div
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-3 text-muted-foreground transition-all hover:bg-secondary group',
                      isActive ? 'bg-primary/10 text-primary font-bold' : '',
                      special ? 'bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10' : ''
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <div className="relative">
                      <Icon className={cn(
                        "h-5 w-5 transition-transform group-hover:scale-110",
                        special ? "text-primary" : ""
                      )} />
                      {showBadge && (
                        <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[11px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 shadow-lg">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="flex-1">{label}</span>
                    {special && (
                      <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

    </>
  );
}
