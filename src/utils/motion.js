/**
 * Atelier Rembrandt — House Motion Choreography & Animation System
 * Quiet luxury easing curves, deliberate momentum, and architectural motion tokens.
 */

// House Luxury Easing Curve (Custom Cubic Bezier for effortless momentum)
export const LUXURY_EASE = [0.19, 1, 0.22, 1];
export const LUXURY_EASE_SOFT = [0.25, 1, 0.5, 1];

// Staggered Container Variant
export const houseContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08
    }
  }
};

// Item Reveal Variant (Deliberate slide-up + fade)
export const houseItemVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.95,
      ease: LUXURY_EASE
    }
  }
};

// Image Reveal Variant (Subtle scale drop + gentle opacity reveal)
export const houseImageVariants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 1.2,
      ease: LUXURY_EASE
    }
  }
};

// Fade Reveal Variant
export const houseFadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.85,
      ease: LUXURY_EASE
    }
  }
};
