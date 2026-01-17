'use client';

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function GlowInput({ className, children, ...props }: { className?: string; children: React.ReactNode }) {
    return (
        <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-400 rounded-lg blur opacity-0 group-focus-within:opacity-50 transition duration-500"></div>
            <div className={cn("relative", className)}>
                {children}
            </div>
        </div>
    );
}
