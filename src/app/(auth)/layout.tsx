import { Logo } from "@/components/logo";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-start overflow-hidden bg-background px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))] md:justify-center md:p-4">
      {/* Decorative background blobs */}
      <div
        className="pointer-events-none absolute top-0 left-0 w-[500px] h-[500px] opacity-70"
        style={{
          background: 'radial-gradient(ellipse at 10% 10%, hsl(335 85% 76% / 0.18) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[500px] opacity-70"
        style={{
          background: 'radial-gradient(ellipse at 90% 90%, hsl(280 60% 70% / 0.14) 0%, transparent 65%)',
        }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] opacity-30"
        style={{
          background: 'radial-gradient(ellipse, hsl(335 85% 76% / 0.08) 0%, transparent 70%)',
        }}
      />

      {/* Top left logo */}
      <div className="absolute left-4 top-4 md:left-8 md:top-8 z-10">
        <Link href="/" className="flex items-center gap-2 text-foreground group">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-110"
            style={{
              background: 'linear-gradient(135deg, hsl(335 85% 76%) 0%, hsl(280 60% 70%) 100%)',
              boxShadow: '0 2px 12px hsl(335 85% 76% / 0.4)',
            }}
          >
            <Logo className="h-5 w-5 text-white" />
          </div>
          <span className="font-headline text-xl font-bold text-gradient">Alora</span>
        </Link>
      </div>

      {/* Theme toggle */}
      <div className="absolute right-4 top-4 md:right-8 md:top-8 z-10">
        <ThemeToggle />
      </div>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-md flex-1 pt-20 md:flex-none md:pt-0">
        {children}
      </main>
    </div>
  );
}
