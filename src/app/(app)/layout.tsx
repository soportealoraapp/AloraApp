import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <a href="#main-content" className="skip-to-content">
        Saltar al contenido
      </a>
      <main id="main-content" className="pb-20 md:pb-0 md:pl-60 pb-safe">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
