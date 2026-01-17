'use client';

import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PremiumFeatureGateProps {
    title?: string;
    description?: string;
    children?: React.ReactNode;
    isLocked?: boolean;
    onUpgrade?: () => void;
}

export function PremiumFeatureGate({
    title = "Premium Feature",
    description = "Upgrade to verify your identity and access exclusive features.",
    children,
    isLocked = true,
    onUpgrade
}: PremiumFeatureGateProps) {
    if (!isLocked) {
        return <>{children}</>;
    }

    return (
        <Card className="border-dashed border-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center p-6">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{title}</h3>
                        <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <Button onClick={onUpgrade} className="w-full">
                        Unlock Premium
                    </Button>
                </div>
            </div>
            <div className="opacity-25 pointer-events-none filter blur-sm" aria-hidden="true">
                {children}
            </div>
        </Card>
    );
}
