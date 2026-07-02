export const EMOTIONAL_MOTION = {
    // Easings that feel organic and "human"
    spring: {
        soft: { type: "spring" as const, stiffness: 100, damping: 20 },
        bouncy: { type: "spring" as const, stiffness: 300, damping: 15 },
        gentle: { type: "spring" as const, stiffness: 50, damping: 25 },
        card: { type: "spring" as const, stiffness: 180, damping: 35 },
        button: { type: "spring" as const, stiffness: 350, damping: 30 }
    },

    // Durations for emotional states
    durations: {
        quickFeedback: 0.2, // Taps, small changes
        meaningfulReveal: 0.6, // Matches, profile opening
        calmTransition: 0.8 // Page changes, loading finish
    },

    // Viewport transition presets
    fadeUp: {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: "easeOut" }
    },

    matchReveal: {
        initial: { scale: 0.8, opacity: 0, filter: "blur(10px)" },
        animate: { scale: 1, opacity: 1, filter: "blur(0px)" },
        transition: { duration: 0.8, ease: "anticipate" }
    },

    // Card entry animation
    cardEntry: {
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: "spring" as const, stiffness: 180, damping: 35 }
    },

    // Swipe exit animations
    swipeRight: { x: 500, opacity: 0, rotate: 20 },
    swipeLeft: { x: -500, opacity: 0, rotate: -20 }
};
