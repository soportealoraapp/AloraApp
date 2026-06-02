import { BottomNav } from '@/components/layout/bottom-nav';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <main className="pb-20 md:pb-0">
        <ErrorBoundary>{children}</ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
