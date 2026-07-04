'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    className="fixed top-0 left-0 right-0 z-[100] bg-warning/10 border-b border-warning/20 px-4 py-3 pt-safe"
                    role="alert"
                >
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 text-warning-foreground">
                            <WifiOff className="h-4 w-4" />
                            <span className="text-sm font-medium">Sin conexión</span>
                            <span className="text-xs text-muted-foreground">Algunas funciones pueden no estar disponibles</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.location.reload()}
                            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reconectar
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
