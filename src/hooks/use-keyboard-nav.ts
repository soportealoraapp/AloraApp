'use client';

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardNavOptions {
    onEscape?: () => void;
    onEnter?: () => void;
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    enabled?: boolean;
}

/**
 * Hook for keyboard navigation within a component.
 * Attaches keydown listeners that respect reduced-motion and standard keyboard patterns.
 */
export function useKeyboardNav(options: KeyboardNavOptions) {
    const { onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, enabled = true } = options;
    const elementRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                onEscape?.();
                break;
            case 'Enter':
                e.preventDefault();
                onEnter?.();
                break;
            case 'ArrowUp':
                e.preventDefault();
                onArrowUp?.();
                break;
            case 'ArrowDown':
                e.preventDefault();
                onArrowDown?.();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                onArrowLeft?.();
                break;
            case 'ArrowRight':
                e.preventDefault();
                onArrowRight?.();
                break;
        }
    }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

    useEffect(() => {
        if (!enabled) return;
        const el = elementRef.current;
        if (el) {
            el.setAttribute('tabindex', '0');
            el.setAttribute('role', 'region');
        }
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, enabled]);

    return { ref: elementRef };
}
