export const EMOTIONAL_MOTION = {
    // Easings that feel organic and "human"
    spring: {
        soft: { type: "spring", stiffness: 100, damping: 20 },
        bouncy: { type: "spring", stiffness: 300, damping: 15 },
        gentle: { type: "spring", stiffness: 50, damping: 25 }
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
    }
};
