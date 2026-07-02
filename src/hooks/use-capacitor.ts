'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isNativePlatform } from '@/lib/mobile';

/**
 * Initializes Capacitor native features (status bar, back button, app state).
 * Should be mounted once in the app layout.
 */
export function useCapacitor() {
    const router = useRouter();

    useEffect(() => {
        if (!isNativePlatform()) return;

        // Status bar: set dark style to match app theme
        import('@/lib/mobile').then(({ setStatusBarStyle, setStatusBarBackgroundColor }) => {
            setStatusBarStyle('DARK');
            setStatusBarBackgroundColor('#1a1215');
        }).catch(() => {});

        // Back button: navigate back on Android hardware back
        const cleanupBackButton = import('@/lib/mobile').then(({ setupBackButton }) => {
            return setupBackButton(() => {
                router.back();
            });
        }).catch(() => () => {});

        // App state: could be used for analytics or refreshing data on foreground
        const cleanupAppState = import('@/lib/mobile').then(({ setupAppStateListeners }) => {
            return setupAppStateListeners(
                () => { /* onBackground */ },
                () => { /* onForeground — could refresh data here */ }
            );
        }).catch(() => () => {});

        return () => {
            cleanupBackButton.then(cleanup => cleanup());
            cleanupAppState.then(cleanup => cleanup());
        };
    }, [router]);
}
