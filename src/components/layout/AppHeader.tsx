import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export function AppHeader({ title, showBack = false, onBack, rightContent, className }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6 shrink-0",
      className
    )}>
      {showBack && (
        <Button variant="ghost" size="icon" onClick={onBack || (() => router.back())}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <h1 className="text-xl font-bold md:text-2xl text-foreground shrink-0">{title}</h1>
      {rightContent && (
        <div className="ml-auto flex items-center gap-2">{rightContent}</div>
      )}
    </header>
  );
}
