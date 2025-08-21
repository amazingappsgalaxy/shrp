// Animation configurations and utilities for premium UI
import { Variants } from 'framer-motion';

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
} as const;

export const EASING_FUNCTIONS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  ios: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const STAGGER_DELAYS = {
  xs: 50,
  sm: 100,
  md: 150,
  lg: 200,
  xl: 250,
} as const;

// Framer Motion variants for common animations
export const fadeInVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const slideInLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const slideInRightVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

export const scaleInVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "backOut" as const,
    },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const logoGlowVariants: Variants = {
  initial: {
    filter: 'drop-shadow(0 0 10px hsl(199 100% 50% / 0.3))',
  },
  animate: {
    filter: 'drop-shadow(0 0 20px hsl(199 100% 50% / 0.6))',
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: [0.4, 0.0, 0.6, 1.0], // easeInOut cubic-bezier equivalent
      repeatType: 'reverse',
    },
  },
};

export const sparkleVariants = {
  initial: {
    opacity: 1,
    scale: 1,
  },
  animate: {
    opacity: [1, 0.5, 1],
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const floatVariants = {
  initial: {
    y: 0,
  },
  animate: {
    y: [-10, 0, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Scroll-triggered animation configurations
export const scrollAnimationConfig = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px',
};

// Parallax scroll configurations
export const parallaxConfig = {
  hero: {
    speed: 0.5,
    direction: 'up',
  },
  background: {
    speed: 0.3,
    direction: 'up',
  },
  foreground: {
    speed: 0.7,
    direction: 'down',
  },
};

// Image zoom configurations
export const imageZoomConfig = {
  scale: 1.05,
  duration: 0.5,
  ease: 'easeOut',
};

// Glassmorphism hover effects
export const glassHoverVariants = {
  initial: {
    backdropFilter: 'blur(20px)',
    background: 'rgba(255, 255, 255, 0.05)',
  },
  hover: {
    backdropFilter: 'blur(30px)',
    background: 'rgba(255, 255, 255, 0.08)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Button hover effects
export const premiumButtonVariants = {
  initial: {
    scale: 1,
    boxShadow: '0 4px 15px hsl(199 100% 50% / 0.3)',
  },
  hover: {
    scale: 1.02,
    y: -2,
    boxShadow: '0 8px 25px hsl(199 100% 50% / 0.4)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  tap: {
    scale: 0.98,
    y: 0,
    transition: {
      duration: 0.1,
    },
  },
};

// Card hover effects
export const cardHoverVariants = {
  initial: {
    y: 0,
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  hover: {
    y: -4,
    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

// Loading animation variants
export const loadingVariants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Page transition variants
export const pageTransitionVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};