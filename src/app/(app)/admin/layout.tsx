'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/discover');
      return;
    }

    let cancelled = false;

    const checkAdmin = async () => {
      try {
        const res = await fetch('/api/admin/verifications?limit=1');
        if (!cancelled) {
          setIsAuthorized(res.ok);
          if (!res.ok) router.replace('/discover');
        }
      } catch {
        if (!cancelled) {
          setIsAuthorized(false);
          router.replace('/discover');
        }
      }
    };

    checkAdmin();

    return () => { cancelled = true; };
  }, [user, authLoading, router]);

  if (authLoading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
