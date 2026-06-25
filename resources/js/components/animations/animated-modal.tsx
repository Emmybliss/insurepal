import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode } from 'react';

import { modalBackdrop, modalContent } from '@/lib/animations';
import { cn } from '@/lib/utils';

interface AnimatedModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string;
    showBackdrop?: boolean;
}

/**
 * Animated modal with backdrop and content animations
 * Handles enter/exit transitions automatically
 */
export function AnimatedModal({ isOpen, onClose, children, className = '', showBackdrop = true }: AnimatedModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {showBackdrop && (
                        <motion.div
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={modalBackdrop}
                            onClick={onClose}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                        />
                    )}

                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            variants={modalContent}
                            className={cn(
                                'relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800',
                                className,
                            )}
                        >
                            {children}
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
