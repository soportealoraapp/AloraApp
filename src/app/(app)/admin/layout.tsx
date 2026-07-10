'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_LOGIN_PATH = '/admin/login';

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
