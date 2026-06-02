import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface AvatarGlowProps {
    src?: string;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    verified?: boolean;
}

export function AvatarGlow({ src, alt, fallback, size = "md", className, verified }: AvatarGlowProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-20 w-20",
        xl: "h-32 w-32",
    };

    return (
        <div className={cn("relative inline-block", className)}>
            <div className={cn(
                "rounded-full p-[2px] bg-gradient-to-br from-primary/40 via-primary/30 to-primary/40",
                sizeClasses[size]
            )}>
                <Avatar className="h-full w-full border-2 border-background">
                    <AvatarImage src={src} alt={alt} className="object-cover" />
                    <AvatarFallback>{fallback || "??"}</AvatarFallback>
                </Avatar>
            </div>
            {verified && (
                <div className="absolute bottom-0 right-0 bg-primary rounded-full p-0.5 border-2 border-background">
                    <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                </div>
            )}
        </div>
    );
}
