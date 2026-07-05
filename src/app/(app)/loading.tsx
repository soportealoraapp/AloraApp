export default function Loading() {
    return (
        <div className="min-h-dvh bg-background pb-20 md:pb-0 md:ml-60">
            <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-xl pt-safe">
                <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
                    <div className="h-6 w-32 rounded bg-muted animate-pulse" />
                </div>
            </header>
            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                <div className="h-48 rounded-2xl bg-muted animate-pulse" />
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-3/4 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-1/3 rounded bg-muted animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-2/5 rounded bg-muted animate-pulse" />
                    </div>
                </div>
            </main>
        </div>
    );
}
