import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

import { cardHover } from '@/lib/animations';
import { cn } from '@/lib/utils';
import { Card } from '../ui/card';

interface AnimatedCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    enableHover?: boolean;
}

export function AnimatedCard({ children, className = '', onClick, enableHover = true }: AnimatedCardProps) {
    return (
        <motion.div
            initial="rest"
            whileHover={enableHover ? 'hover' : undefined}
            whileTap={enableHover ? 'tap' : undefined}
            variants={cardHover as Variants}
            onClick={onClick}
            className={cn(onClick && 'cursor-pointer', className)}
        >
            <Card>{children}</Card>
        </motion.div>
    );
}
