'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlusBadgeProps {
    className?: string;
    size?: 'sm' | 'md';
    variant?: 'default' | 'subtle';
    label?: string;
}

export function PlusBadge({ className, size = 'sm', variant = 'default', label = 'Plus' }: PlusBadgeProps) {
    const sizeClasses = size === 'sm'
        ? 'text-xs px-1.5 py-0.5'
        : 'text-xs px-2 py-1';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 font-bold rounded-full whitespace-nowrap',
                sizeClasses,
                variant === 'default'
                    ? 'bg-gradient-to-r from-amber-400 to-pink-500 text-white'
                    : 'bg-amber-50 text-amber-700 border border-amber-200',
                className
            )}
        >
            <Sparkles className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
            {label}
        </span>
    );
}
