import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

import { toast } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedNotificationProps {
    isVisible: boolean;
    children: ReactNode;
    className?: string;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

/**
 * Animated notification/toast component
 * Slides in from the right with fade effect
 */
export function AnimatedNotification({ isVisible, children, className = '', position = 'top-right' }: AnimatedNotificationProps) {
    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={toast}
                    className={cn('fixed z-50 w-full max-w-sm rounded-lg border bg-background p-4 shadow-lg', positionClasses[position], className)}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
