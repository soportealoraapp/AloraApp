'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Compass, Bell, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../logo';
import { useNotifications } from '@/hooks/use-notifications';
import { hapticsLight } from '@/lib/mobile';

const navItems = [
  { href: '/discover', icon: Compass, label: 'Descubrir' },
  { href: '/matches', icon: Heart, label: 'Conexiones' },
  { href: '/compatibility', icon: Sparkles, label: 'Almas', special: true },
  { href: '/notifications', icon: Bell, label: 'Actividad' },
  { href: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications({ pollIntervalMs: 300_000, enableRealtime: false });


  return (
    <>
      {/* Bottom Navigation for Mobile */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe"
        aria-label="Navegación principal"
        style={{
          background: 'linear-gradient(to top, hsl(var(--background)) 80%, hsl(var(--background) / 0.92))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid hsl(var(--border) / 0.5)',
        }}
      >
        {/* Gradient top border */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.5), hsl(280 60% 70% / 0.5), transparent)',
          }}
        />
        <div className="flex justify-around items-center h-16">
          {navItems.map(({ href, icon: Icon, label, special }) => {
            const isActive = pathname.startsWith(href);
            const showBadge = href === '/notifications' && unreadCount > 0;

            if (special) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex-1 flex flex-col items-center justify-center relative -top-3"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => hapticsLight()}
                >
                  <motion.div
                    whileTap={{ scale: 0.88 }}
                    className="flex flex-col items-center"
                  >
                    <div
                      className={cn(
                        "relative h-14 w-14 rounded-full flex items-center justify-center border-4 border-background transition-all duration-300",
                        isActive
                          ? "scale-110"
                          : ""
                      )}
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg, hsl(335 85% 68%) 0%, hsl(280 60% 63%) 100%)'
                          : 'linear-gradient(135deg, hsl(335 85% 76% / 0.85) 0%, hsl(280 60% 70% / 0.85) 100%)',
                        boxShadow: isActive
                          ? '0 4px 20px hsl(335 85% 76% / 0.5), 0 2px 8px hsl(280 60% 70% / 0.3)'
                          : '0 2px 12px hsl(335 85% 76% / 0.25)',
                      }}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black tracking-widest uppercase mt-1 transition-all",
                      isActive ? "text-primary scale-105" : "text-muted-foreground"
                    )}>
                      {label}
                    </span>
                  </motion.div>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center justify-center relative"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => hapticsLight()}
              >
                <motion.div
                  whileTap={{ scale: 0.88 }}
                  className="flex flex-col items-center gap-0.5 relative px-3 py-1.5"
                >
                  {/* Active pill background */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-bg"
                        className="absolute inset-0 rounded-xl"
                        style={{
                          background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.15) 0%, hsl(280 60% 70% / 0.1) 100%)',
                        }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      />
                    )}
                  </AnimatePresence>

                  <div className="relative z-10">
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] transition-all duration-200",
                        isActive ? "text-primary scale-110" : "text-muted-foreground"
                      )}
                      style={isActive ? { filter: 'drop-shadow(0 0 4px hsl(335 85% 76% / 0.5))' } : {}}
                    />
                    {showBadge && (
                      <span
                        className="absolute -top-1 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                        style={{ boxShadow: '0 0 0 2px hsl(var(--background)), 0 0 8px hsl(0 84% 60% / 0.4)' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-bold tracking-tight uppercase z-10",
                      isActive ? "text-primary" : "text-muted-foreground/70"
                    )}
                  >
                    {label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar for Desktop */}
      <nav
        className="hidden md:fixed md:left-0 md:top-0 md:bottom-0 md:z-10 md:flex md:w-60 md:flex-col md:border-r"
        style={{
          background: 'hsl(var(--background))',
          borderColor: 'hsl(var(--border) / 0.5)',
        }}
        aria-label="Navegación principal"
      >
        {/* Subtle gradient top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(335 85% 76% / 0.6), hsl(280 60% 70% / 0.6), transparent)',
          }}
        />

        <div className="flex h-20 items-center px-6">
          <Link href="/discover" className="flex items-center gap-2.5 font-semibold group">
            <div className="relative">
              <Logo className="h-9 w-9 text-primary transition-transform duration-200 group-hover:scale-110" />
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: 'radial-gradient(circle, hsl(335 85% 76% / 0.3) 0%, transparent 70%)' }}
              />
            </div>
            <span className="font-headline text-2xl text-gradient">Alora</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-1 p-3">
            {navItems.map(({ href, icon: Icon, label, special }) => {
              const isActive = pathname.startsWith(href);
              const showBadge = href === '/notifications' && unreadCount > 0;
              return (
                <Link key={href} href={href}>
                  <div
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 group',
                      isActive
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    style={
                      isActive
                        ? {
                            background: 'linear-gradient(135deg, hsl(335 85% 76% / 0.12) 0%, hsl(280 60% 70% / 0.08) 100%)',
                            boxShadow: 'inset 0 0 0 1px hsl(335 85% 76% / 0.2)',
                          }
                        : {}
                    }
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Hover background */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-xl bg-secondary/0 group-hover:bg-secondary/50 transition-all duration-200" />
                    )}

                    <div className="relative z-10">
                      <Icon className={cn(
                        "h-5 w-5 transition-all duration-200 group-hover:scale-110",
                        special ? "text-primary" : "",
                        isActive ? "text-primary" : ""
                      )}
                        style={isActive ? { filter: 'drop-shadow(0 0 4px hsl(335 85% 76% / 0.4))' } : {}}
                      />
                      {showBadge && (
                        <span
                          className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-1"
                          style={{ boxShadow: '0 0 0 2px hsl(var(--background))' }}
                        >
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <span className="flex-1 z-10 text-sm">{label}</span>
                    {special && (
                      <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse z-10" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div
          className="h-8 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
          }}
        />
      </nav>
    </>
  );
}
