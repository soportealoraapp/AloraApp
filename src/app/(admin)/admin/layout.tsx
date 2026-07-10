'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/lib/supabase/services/auth';

const ADMIN_LOGIN_PATH = '/admin/login';
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutos
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  const isLoginPage = pathname === ADMIN_LOGIN_PATH;

  useEffect(() => {
    // La página de login se renderiza sin guardas de rol.
    if (isLoginPage) return;

    if (authLoading) return;

    if (!user) {
      router.replace(ADMIN_LOGIN_PATH);
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/verifications?limit=1');
        if (!cancelled) {
          setIsAuthorized(res.ok);
          if (!res.ok) router.replace(ADMIN_LOGIN_PATH);
        }
      } catch {
        if (!cancelled) {
          setIsAuthorized(false);
          router.replace(ADMIN_LOGIN_PATH);
        }
      }
    };

    checkAdmin();

    return () => { cancelled = true; };
  }, [user, authLoading, router, isLoginPage, pathname]);

  // Cierre automático de sesión por inactividad (solo cuando el admin está autorizado).
  useEffect(() => {
    if (isAuthorized !== true) return;

    let timer: ReturnType<typeof setTimeout>;

    const logout = async () => {
      try {
        await authService.signOut();
      } finally {
        router.replace(`${ADMIN_LOGIN_PATH}?timeout=1`);
      }
    };

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, INACTIVITY_LIMIT_MS);
    };

    reset();
    ACTIVITY_EVENTS.forEach((evt) =>
      window.addEventListener(evt, reset, { passive: true }),
    );

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, reset));
    };
  }, [isAuthorized, router]);

  // Renderizar la página de login directamente.
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (authLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
