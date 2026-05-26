/**
 * Shared motion constants for consistent animations across the app.
 */

export const SPRING = {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    snappy: { type: 'spring' as const, stiffness: 300, damping: 30 },
    bouncy: { type: 'spring' as const, stiffness: 180, damping: 10 },
    stiff: { type: 'spring' as const, stiffness: 400, damping: 40 },
};

export const TRANSITION = {
    default: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
    slow: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
    fast: { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] },
    smooth: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    spring: SPRING.gentle,
};

export const VARIANTS = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    slideUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    },
    slideDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -10 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
    },
    scaleInFrom: (origin: string) => ({
        initial: { opacity: 0, scale: 0.9, originX: origin === 'left' ? 0 : 1, originY: 0 },
        animate: { opacity: 1, scale: 1, originX: origin === 'left' ? 0 : 1, originY: 0 },
        exit: { opacity: 0, scale: 0.9, originX: origin === 'left' ? 0 : 1, originY: 0 },
    }),
    listItem: {
        initial: { opacity: 0, x: -10 },
        animate: (i: number) => ({
            opacity: 1, x: 0,
            transition: { delay: i * 0.05, ...TRANSITION.default },
        }),
        exit: { opacity: 0, x: -10 },
    },
};

/**
 * Check if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Return animation props that respect reduced motion preference.
 */
export function reducedMotionSafe(variants: typeof VARIANTS.fadeIn) {
    if (prefersReducedMotion()) {
        return {
            initial: { opacity: 1 },
            animate: { opacity: 1 },
            exit: { opacity: 1 },
            transition: { duration: 0 },
        };
    }
    return {
        ...variants,
        transition: TRANSITION.default,
    };
}
