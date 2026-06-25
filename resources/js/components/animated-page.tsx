import { motion } from 'framer-motion';
import { ReactNode } from 'react';

import { pageTransition } from '@/lib/animations';

interface AnimatedPageProps {
    children: ReactNode;
    className?: string;
}

/**
 * Animated page wrapper for Inertia pages
 * Provides smooth page transitions
 */
export function AnimatedPage({ children, className = '' }: AnimatedPageProps) {
    return (
        <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition} className={className}>
            {children}
        </motion.div>
    );
}
