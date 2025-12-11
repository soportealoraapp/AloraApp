import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SoftCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Card
            className={cn(
                "bg-white/80 backdrop-blur-md border-pink-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
}
