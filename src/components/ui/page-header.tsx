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
        <header className={cn("app-page-header gap-4 sm:px-6", className)}>
            {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} aria-label="Volver">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            )}
            <h1 className="min-w-0 flex-1 truncate font-headline text-xl font-bold text-gradient md:text-2xl">{title}</h1>
            {rightAction}
        </header>
    );
}
