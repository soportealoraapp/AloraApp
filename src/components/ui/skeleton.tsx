import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted relative overflow-hidden", className)}
            {...props}
        >
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent dark:via-white/5" />
        </div>
    )
}

export function FormSkeleton() {
    return (
        <div className="space-y-6 p-4">
            <div className="space-y-2 text-center">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
            </div>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-12 w-full rounded-2xl" />
                </div>
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="w-full max-w-md p-8 space-y-6">
            <div className="space-y-2 text-center">
                <Skeleton className="h-6 w-32 mx-auto" />
                <Skeleton className="h-4 w-56 mx-auto" />
            </div>
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
        </div>
    );
}

export { Skeleton }
