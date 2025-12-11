'use client';

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GlowInput({ className, ...props }: React.ComponentProps<typeof Input>) {
    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500"></div>
            <Input
                className={cn("relative bg-white border-transparent focus:border-transparent ring-offset-0 focus:ring-0", className)}
                {...props}
            />
        </div>
    );
}
