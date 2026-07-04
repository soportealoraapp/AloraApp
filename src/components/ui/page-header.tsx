import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    onBack?: () => void;
    rightAction?: React.ReactNode;
    className?: string;
}

export function PageHeader({ title, onBack, rightAction, className }: PageHeaderProps) {
    return (
        <header className={cn("sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 pt-safe", className)}>
            {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <h1 className="text-xl font-semibold md:text-2xl font-headline flex-1 min-w-0">{title}</h1>
            {rightAction}
        </header>
    );
}
