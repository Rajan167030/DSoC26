import { useReducedMotion } from "framer-motion";

// Smoother GSAP-like easing curves for buttery animations
export const easing = [0.16, 1, 0.3, 1]; // power3.out equivalent
export const easingInOut = [0.76, 0, 0.24, 1]; // power3.inOut equivalent

// Basic fade + upward translation
export const fadeInUp = {
    hidden: { opacity: 0, y: 24, willChange: "transform, opacity" },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: easing } },
};

// Dynamic variant allowing index-based delays via the `custom` prop
export const fadeInUpCustom = {
    hidden: { opacity: 0, y: 24, willChange: "transform, opacity" },
    show: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: easing, delay: i * 0.12 },
    }),
};

// Scale + fade for hero visuals / cards
export const scaleIn = {
    hidden: { opacity: 0, scale: 0.92, willChange: "transform, opacity" },
    show: { opacity: 1, scale: 1, transition: { duration: 0.85, ease: easing } },
};

// Section wrapper enabling stagger of children
export const staggerContainer = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

// Slight blur fade suitable for images/media blocks
export const blurReveal = {
    hidden: { opacity: 0, filter: "blur(8px)", willChange: "filter, opacity" },
    show: {
        opacity: 1,
        filter: "blur(0px)",
        transition: { duration: 0.9, ease: easing },
    },
};

// Card entry variant
export const cardVariant = {
    hidden: { opacity: 0, y: 16, scale: 0.98, willChange: "transform, opacity" },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.75, ease: easing },
    },
};

// Generic section fade (used for simple wrappers)
export const sectionVariant = {
    hidden: { opacity: 0, y: 32, willChange: "transform, opacity" },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.9, ease: easing },
    },
};

// Helper hook to surface reduced-motion friendly variants
export function useMotionPref() {
    const prefersReduced = useReducedMotion();
    // When reduced motion is requested, simplify animations.
    if (prefersReduced) {
        return {
            fadeInUp: { hidden: { opacity: 0 }, show: { opacity: 1 } },
            fadeInUpCustom: { hidden: { opacity: 0 }, show: () => ({ opacity: 1 }) },
            scaleIn: { hidden: { opacity: 0 }, show: { opacity: 1 } },
            staggerContainer, // Stagger remains harmless; timing still okay.
            blurReveal: { hidden: { opacity: 0 }, show: { opacity: 1 } },
            cardVariant: { hidden: { opacity: 0 }, show: { opacity: 1 } },
            sectionVariant: { hidden: { opacity: 0 }, show: { opacity: 1 } },
        };
    }
    return {
        fadeInUp,
        fadeInUpCustom,
        scaleIn,
        staggerContainer,
        blurReveal,
        cardVariant,
        sectionVariant,
    };
}

// Utility to choose reduced or standard variant object inline if you don't want the hook.
export function motionSafe(variant, prefersReduced) {
    if (!prefersReduced) return variant;
    // Simplify: map any variant to opacity-only reveal.
    return {
        hidden: { opacity: 0 },
        show: typeof variant.show === "function" ? () => ({ opacity: 1 }) : { opacity: 1 },
    };
}
