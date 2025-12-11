import { cn } from "@/lib/utils";

interface SectionTitleProps {
    title: string;
    subtitle?: string;
    className?: string;
}

export function SectionTitle({ title, subtitle, className }: SectionTitleProps) {
    return (
        <div className={cn("mb-6", className)}>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-500 font-headline">
                {title}
            </h2>
            {subtitle && (
                <p className="text-muted-foreground mt-1 text-sm font-body">
                    {subtitle}
                </p>
            )}
            <div className="h-1 w-12 bg-pink-300 rounded-full mt-2" />
        </div>
    );
}
