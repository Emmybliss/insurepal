import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

import { fadeIn, scaleIn, slideDown, slideLeft, slideRight, slideUp, staggerContainer } from '@/lib/animations';

interface AnimatedContainerProps {
    children: ReactNode;
    className?: string;
    animation?: 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'stagger';
    delay?: number;
    duration?: number;
}

const animationVariants: Record<string, Variants> = {
    fade: fadeIn,
    slideUp,
    slideDown,
    slideLeft,
    slideRight,
    scale: scaleIn,
    stagger: staggerContainer,
};

export function AnimatedContainer({ children, className = '', animation = 'fade', delay = 0, duration = 0.3 }: AnimatedContainerProps) {
    const variants = animationVariants[animation];

    return (
        <motion.div
            initial="initial"
            animate="animate"
            exit="exit"
            variants={variants}
            transition={{
                delay,
                duration,
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
