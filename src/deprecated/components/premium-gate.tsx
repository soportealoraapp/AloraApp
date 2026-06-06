import { Lock, Sparkles } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/tracking/client";
import { cn } from "@/lib/utils";

interface PremiumFeatureGateProps {
    title?: string;
    description?: string;
    children?: React.ReactNode;
    isLocked?: boolean;
    onUpgrade?: () => void;
    featureName?: string;
    userId?: string;
}

import { motion, AnimatePresence } from "framer-motion";

export function PremiumFeatureGate({
    title = "Premium Feature",
    description = "Upgrade to verify your identity and access exclusive features.",
    children,
    isLocked = true,
    onUpgrade,
    featureName,
    userId
}: PremiumFeatureGateProps) {
    if (!isLocked) {
        return <>{children}</>;
    }

    const [clickCount, setClickCount] = React.useState(0);
    const [isShaking, setIsShaking] = React.useState(false);

    const handleUnlockClick = () => {
        setClickCount(prev => prev + 1);

        if (clickCount >= 5) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            if (userId) trackEvent('RISK_FLAG_EXCESSIVE_CLICKS', { userId, feature: featureName, count: clickCount + 1 });
            return;
        }

        if (userId) {
            trackEvent('PREMIUM_GATE_CLICK', { userId, feature: featureName || 'unknown' });
        }
        onUpgrade?.();
    };

    return (
        <Card className="relative overflow-hidden group border-none shadow-none bg-transparent">
            <AnimatePresence>
                <motion.div
                    animate={isShaking ? { x: [-4, 4, -4, 4, 0] } : {}}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className={cn(
                        "absolute inset-0 bg-background/60 backdrop-blur-[6px] z-10 flex items-center justify-center p-4 md:p-6 transition-all duration-500 rounded-3xl border-2 border-dashed",
                        isShaking ? 'border-red-500/50' : 'border-primary/20 hover:border-primary/40'
                    )}
                >
                    <div className="text-center space-y-4 max-w-sm relative">
                        {featureName && (
                            <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur-md border-primary/20 text-primary">
                                {featureName} Restricted
                            </Badge>
                        )}
                        <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-sm"
                        >
                            <Lock className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                        </motion.div>
                        <div className="space-y-2">
                            <h3 className="font-semibold text-lg md:text-xl tracking-tight">{title}</h3>
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed px-4">{description}</p>
                        </div>
                        <Button onClick={handleUnlockClick} className="w-full gap-2 rounded-2xl shadow-lg hover:shadow-primary/25 transition-all">
                            <Sparkles className="w-4 h-4" />
                            Unlock Premium Access
                        </Button>
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="opacity-25 pointer-events-none filter blur-md select-none grayscale scale-[0.98]" aria-hidden="true">
                {children}
            </div>
        </Card>
    );
}
