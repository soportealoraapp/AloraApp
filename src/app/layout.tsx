import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { SafetyGuard } from '@/components/safety/SafetyGuard';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { AgeGate } from '@/components/auth/AgeGate';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* ... fonts */}
      </head>
      <body className={cn('font-body antialiased', 'min-h-screen bg-background font-sans')}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AgeGate />
            <AuthGate>
              <SafetyGuard>
                <OfflineBanner />
                {children}
              </SafetyGuard>
            </AuthGate>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
