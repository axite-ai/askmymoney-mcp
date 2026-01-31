import type { Variants } from "framer-motion";

/**
 * Shared animation variants for consistent UX across widgets
 * Based on year-gpt-clone patterns following Apps SDK best practices
 */

// Smooth ease curve for natural-feeling animations
const smoothEase = [0.22, 1, 0.36, 1] as const;

/**
 * Fade and slide up animation for container elements
 * Used for widget containers and card-level components
 */
export const fadeSlideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2 },
  },
};

/**
 * Stagger container for parent elements with multiple children
 * Apply to parent, use listItem on children
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/**
 * List item animation for staggered reveals
 * Use with staggerContainer parent
 */
export const listItem: Variants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: smoothEase },
  },
};

/**
 * Fade in animation for simple reveals
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Scale and fade for modal-like content
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: smoothEase },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

/**
 * Expand/collapse animation for accordions
 */
export const expandCollapse: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: smoothEase },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.3, ease: smoothEase },
  },
};

/**
 * Slide from right for panels/drawers
 */
export const slideFromRight: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: smoothEase },
  },
  exit: {
    x: "100%",
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

/**
 * Pulse animation for loading or attention states
 */
export const pulse: Variants = {
  initial: { opacity: 1 },
  animate: {
    opacity: [1, 0.5, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

/**
 * Shared transition presets
 */
export const transitions = {
  fast: { duration: 0.15 },
  normal: { duration: 0.3, ease: smoothEase },
  slow: { duration: 0.5, ease: smoothEase },
  spring: { type: "spring", stiffness: 300, damping: 30 },
} as const;
