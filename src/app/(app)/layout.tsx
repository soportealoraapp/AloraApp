'use client';

import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { usePathname } from 'next/navigation';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChatWindow = /^\/chat\/[^/]+/.test(pathname);

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido
      </a>
      <main
        id="main-content"
        className={`md:pl-60 pb-safe overflow-x-hidden ${isChatWindow ? '' : 'pb-20 md:pb-0'}`}
      >
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      {!isChatWindow && <BottomNav />}
    </div>
  );
}
