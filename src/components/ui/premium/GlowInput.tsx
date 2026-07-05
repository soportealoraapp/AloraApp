import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function GlowInput({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className="relative group">
            <motion.div
                className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500/70 dark:to-purple-500/70 rounded-lg blur"
                initial={{ opacity: 0 }}
                whileFocus={{ opacity: 0.5 }}
                animate={{ opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 150 }}
                style={{ pointerEvents: 'none' }}
            />
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-400 to-purple-400 dark:from-pink-500/70 dark:to-purple-500/70 rounded-lg blur opacity-0 group-focus-within:opacity-40 transition-opacity duration-500" />
            <div className={cn("relative", className)}>
                {children}
            </div>
        </div>
    );
}
