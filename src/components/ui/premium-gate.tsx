import { Lock, Sparkles } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/tracking/client";

interface PremiumFeatureGateProps {
    title?: string;
    description?: string;
    children?: React.ReactNode;
    isLocked?: boolean;
    onUpgrade?: () => void;
    featureName?: string;
    userId?: string;
}

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

    const handleUnlockClick = () => {
        setClickCount(prev => prev + 1);

        // TRUST & SAFETY: Detect excessive clicking (e.g. attempting to bypass or frustration)
        if (clickCount > 5) {
            if (userId) trackEvent('RISK_FLAG_EXCESSIVE_CLICKS', { userId, feature: featureName, count: clickCount });
            return; // Prevent further action spam
        }

        if (userId) {
            trackEvent('PREMIUM_GATE_CLICK', { userId, feature: featureName || 'unknown' });
        }
        onUpgrade?.();
    };

    return (
        <Card className="border-dashed border-2 relative overflow-hidden group hover:border-primary/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex items-center justify-center p-6 transition-all duration-500">
                <div className="text-center space-y-4 max-w-sm relative">
                    {featureName && (
                        <Badge variant="outline" className="mb-2 bg-background/50 backdrop-blur-md border-primary/20 text-primary animate-in fade-in zoom-in duration-500">
                            {featureName} Restricted
                        </Badge>
                    )}
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                        <Lock className="w-8 h-8 text-primary group-hover:text-primary/80 transition-colors" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-semibold text-xl tracking-tight">{title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                    </div>
                    <Button onClick={handleUnlockClick} className="w-full gap-2 shadow-lg hover:shadow-primary/25 transition-all active:scale-95">
                        <Sparkles className="w-4 h-4" />
                        Unlock Premium Access
                    </Button>
                </div>
            </div>
            <div className="opacity-25 pointer-events-none filter blur-md select-none grayscale" aria-hidden="true">
                {children}
            </div>
        </Card>
    );
}
