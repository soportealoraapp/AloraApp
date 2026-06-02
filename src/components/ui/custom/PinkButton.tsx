import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface PinkButtonProps extends ButtonProps {
    glow?: boolean;
}

export function PinkButton({ className, glow, children, ...props }: PinkButtonProps) {
    return (
        <Button
            className={cn(
                "bg-primary hover:bg-primary/90 text-primary-foreground border-none rounded-full font-bold transition-all duration-300",
                glow && "shadow-[0_0_20px_rgba(244,143,177,0.5)] hover:shadow-[0_0_30px_rgba(244,143,177,0.7)]",
                className
            )}
            {...props}
        >
            {children}
            {glow && <Sparkles className="ml-2 h-4 w-4 animate-pulse" />}
        </Button>
    );
}
