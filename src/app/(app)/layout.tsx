'use client';

import { Suspense } from 'react';
import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCapacitor } from '@/hooks/use-capacitor';
import { useEdgeSwipeBack } from '@/hooks/use-edge-swipe-back';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/layout/page-transition';

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useCapacitor();
  useEdgeSwipeBack();
  const isChatWindow = /^\/chat\/[^/]+/.test(pathname);
  const isProfileView = /^\/profile\/[^/]+/.test(pathname);
  const isEditProfile = pathname === '/profile/edit';
  const hideBottomNav = isChatWindow || isProfileView || isEditProfile;

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido
      </a>
      <OfflineBanner />
      <main
        id="main-content"
        className={`relative min-h-dvh overflow-x-hidden md:pl-sidebar ${hideBottomNav ? '' : 'pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0'}`}
      >
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <AnimatePresence mode="wait">
              <PageTransition>
                {children}
              </PageTransition>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
