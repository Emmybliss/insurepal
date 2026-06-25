import { motion } from 'framer-motion';
import { ReactNode } from 'react';

import { staggerItem } from '@/lib/animations';

interface AnimatedListProps {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}

/**
 * Animated list container with stagger effect for children
 * Wraps children and animates them in sequence
 */
export function AnimatedList({ children, className = '', staggerDelay = 0.1 }: AnimatedListProps) {
    return (
        <motion.div
            initial="initial"
            animate="animate"
            variants={{
                animate: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface AnimatedListItemProps {
    children: ReactNode;
    className?: string;
}

/**
 * Individual list item with fade-up animation
 * Use inside AnimatedList for stagger effect
 */
export function AnimatedListItem({ children, className = '' }: AnimatedListItemProps) {
    return (
        <motion.div variants={staggerItem} className={className}>
            {children}
        </motion.div>
    );
}
