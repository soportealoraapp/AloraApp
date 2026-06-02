import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SoftCard({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <Card
            className={cn(
                "bg-card/80 backdrop-blur-md border-border shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl",
                className
            )}
            {...props}
        >
            {children}
        </Card>
    );
}
