import { motion } from 'framer-motion';

import { spinner } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Animated loading spinner
 * Continuous rotation animation
 */
export function AnimatedSpinner({ size = 'md', className = '' }: AnimatedSpinnerProps) {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    return (
        <motion.div
            animate="rotate"
            variants={spinner}
            className={cn('rounded-full border-2 border-gray-300 border-t-primary', sizes[size], className)}
        />
    );
}
