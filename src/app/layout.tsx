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

import { headers } from 'next/headers';

// ... (skipping metadata/viewport for brevity in diff)

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Force dynamic rendering so Next.js can read the nonce from headers and inject it into <script> tags
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') || undefined;

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
