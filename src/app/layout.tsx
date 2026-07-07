import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthGate } from '@/components/auth/AuthGate';
import { SafetyGuard } from '@/components/safety/SafetyGuard';
import { OfflineBanner } from '@/components/offline/OfflineBanner';
import { AgeGate } from '@/components/auth/AgeGate';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: {
    default: 'Alora — Conexiones reales con inteligencia artificial',
    template: '%s | Alora',
  },
  description: 'Dating app con IA integrada. Encuentra conexiones reales.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FDF7F9' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1215' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-dvh bg-background">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <AnalyticsProvider>
              <AgeGate>
              <AuthGate>
                <SafetyGuard>
                  <OfflineBanner />
                  {children}
                </SafetyGuard>
              </AuthGate>
              </AgeGate>
            </AnalyticsProvider>
              <Toaster />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
