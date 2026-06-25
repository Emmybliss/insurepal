import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

import { dropdownMenu } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedDropdownProps {
    isOpen: boolean;
    children: ReactNode;
    className?: string;
    align?: 'left' | 'right' | 'center';
}

/**
 * Animated dropdown menu with fade and scale animation
 * Works with Shadcn DropdownMenu or custom implementations
 */
export function AnimatedDropdown({ isOpen, children, className = '', align = 'right' }: AnimatedDropdownProps) {
    const alignmentClasses = {
        left: 'left-0',
        right: 'right-0',
        center: 'left-1/2 -translate-x-1/2',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={dropdownMenu}
                    className={cn(
                        'absolute z-50 mt-2 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
                        alignmentClasses[align],
                        className,
                    )}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
