import { Variants } from 'framer-motion';

/**
 * Page transition variants for Inertia.js pages
 */
export const pageTransition: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: {
            duration: 0.2,
            ease: 'easeIn',
        },
    },
};

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
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

/**
 * Slide up animation
 */
export const slideUp: Variants = {
    initial: {
        opacity: 0,
        y: 30,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

/**
 * Slide down animation
 */
export const slideDown: Variants = {
    initial: {
        opacity: 0,
        y: -30,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

/**
 * Slide from left animation
 */
export const slideLeft: Variants = {
    initial: {
        opacity: 0,
        x: -30,
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

/**
 * Slide from right animation
 */
export const slideRight: Variants = {
    initial: {
        opacity: 0,
        x: 30,
    },
    animate: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: 'easeOut',
        },
    },
};

/**
 * Scale animation
 */
export const scaleIn: Variants = {
    initial: {
        opacity: 0,
        scale: 0.9,
    },
    animate: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
    animate: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

/**
 * Stagger item animation
 */
export const staggerItem: Variants = {
    initial: {
        opacity: 0,
        y: 20,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
        },
    },
};

/**
 * Card hover animation
 */
export const cardHover = {
    rest: {
        scale: 1,
        transition: {
            duration: 0.2,
        },
    },
    hover: {
        scale: 1.02,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        transition: {
            duration: 0.2,
            ease: 'easeOut',
        },
    },
    tap: {
        scale: 0.98,
    },
};

/**
 * Button tap animation
 */
export const buttonTap = {
    scale: 0.95,
    transition: {
        duration: 0.1,
    },
};

/**
 * Modal backdrop animation
 */
export const modalBackdrop: Variants = {
    initial: {
        opacity: 0,
    },
    animate: {
        opacity: 1,
        transition: {
            duration: 0.2,
        },
    },
    exit: {
        opacity: 0,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Modal content animation
 */
export const modalContent: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: 20,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Dropdown menu animation
 */
export const dropdownMenu: Variants = {
    initial: {
        opacity: 0,
        scale: 0.95,
        y: -10,
    },
    animate: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.15,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: -10,
        transition: {
            duration: 0.1,
        },
    },
};

/**
 * Sidebar animation
 */
export const sidebar: Variants = {
    closed: {
        x: '-100%',
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
    open: {
        x: 0,
        transition: {
            duration: 0.3,
            ease: 'easeInOut',
        },
    },
};

/**
 * Notification toast animation
 */
export const toast: Variants = {
    initial: {
        opacity: 0,
        x: 100,
        scale: 0.8,
    },
    animate: {
        opacity: 1,
        x: 0,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: 'easeOut',
        },
    },
    exit: {
        opacity: 0,
        x: 100,
        scale: 0.8,
        transition: {
            duration: 0.2,
        },
    },
};

/**
 * Loading spinner animation
 */
export const spinner = {
    rotate: {
        rotate: 360,
        transition: {
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
        },
    },
};

/**
 * Pulse animation
 */
export const pulse = {
    scale: [1, 1.05, 1],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
    },
};

/**
 * Bounce animation
 */
export const bounce = {
    y: [0, -10, 0],
    transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
    },
};

/**
 * Shake animation
 */
export const shake = {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
        duration: 0.5,
    },
};

/**
 * Custom spring transition
 */
export const springTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 30,
};

/**
 * Custom easing curves
 */
export const easings = {
    easeInOut: [0.43, 0.13, 0.23, 0.96],
    easeOut: [0.19, 1.0, 0.22, 1.0],
    easeIn: [0.87, 0, 0.13, 1.0],
    custom: [0.6, 0.05, 0.01, 0.9],
};
