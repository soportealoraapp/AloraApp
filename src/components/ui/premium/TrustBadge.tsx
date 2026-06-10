"use client";

import { CheckCircle2, ShieldCheck, Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
    type: "verified" | "complete" | "premium";
    className?: string;
    showLabel?: boolean;
}

const BADGE_CONFIG = {
    verified: {
        icon: ShieldCheck,
        color: "text-blue-500",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        label: "Verificado",
        description: "Identidad confirmada mediante selfie o datos oficiales."
    },
    complete: {
        icon: CheckCircle2,
        color: "text-green-500",
        bg: "bg-green-50 dark:bg-green-900/20",
        label: "Perfil Top",
        description: "Este usuario ha completado toda su información para una mejor experiencia."
    },
    premium: {
        icon: Star,
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        label: "Plus",
        description: "Miembro Alora Plus con compromiso activo en la comunidad."
    }
};

export function TrustBadge({ type, className, showLabel = false }: TrustBadgeProps) {
    const config = BADGE_CONFIG[type];
    const Icon = config.icon;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-tight transition-all cursor-help",
                        config.bg,
                        config.color,
                        className
                    )}>
                        <Icon className="h-3 w-3" />
                        {showLabel && <span>{config.label}</span>}
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs p-2">
                    <p className="font-bold mb-0.5">{config.label}</p>
                    <p className="text-muted-foreground leading-tight">{config.description}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
