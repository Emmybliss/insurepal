import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type LoaderVariant = 'spinner' | 'pulse' | 'dots' | 'ring' | 'box';
type LoaderSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoaderProps {
    variant?: LoaderVariant;
    size?: LoaderSize;
    className?: string;
    color?: string;
}

interface FullscreenLoaderProps {
    show?: boolean;
    variant?: LoaderVariant;
    size?: LoaderSize;
    text?: string;
    className?: string;
    color?: string;
}

const sizeClasses: Record<LoaderSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
};

const variantStyles: Record<LoaderVariant, string> = {
    spinner: 'animate-spin rounded-full border-2 border-transparent',
    pulse: 'animate-pulse rounded-full',
    dots: 'animate-bounce',
    ring: 'animate-[spin_1.5s_linear_infinite] rounded-full border-2 border-transparent',
    box: 'animate-pulse',
};

function Loader({ variant = 'spinner', size = 'md', className, color }: LoaderProps) {
    const style = color ? { borderColor: color, borderTopColor: 'transparent' } : {};

    if (variant === 'dots') {
        return (
            <div className={cn('flex gap-1', className)}>
                <span
                    className={cn(
                        sizeClasses[size],
                        'bg-current rounded-full animate-[bounce_1s_infinite]',
                        color || 'bg-primary',
                    )}
                    style={{ backgroundColor: color }}
                />
                <span
                    className={cn(
                        sizeClasses[size],
                        'bg-current rounded-full animate-[bounce_1s_infinite_0.2s]',
                        color || 'bg-primary',
                    )}
                    style={{ backgroundColor: color }}
                />
                <span
                    className={cn(
                        sizeClasses[size],
                        'bg-current rounded-full animate-[bounce_1s_infinite_0.4s]',
                        color || 'bg-primary',
                    )}
                    style={{ backgroundColor: color }}
                />
            </div>
        );
    }

    if (variant === 'box') {
        return (
            <div className={cn('grid grid-cols-3 gap-1', className)}>
                {[...Array(9)].map((_, i) => (
                    <div
                        key={i}
                        className={cn(
                            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4',
                            'animate-[pulse_1.5s_ease-in-out_infinite]',
                            color || 'bg-primary/60',
                        )}
                        style={{
                            backgroundColor: color,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={cn(
                sizeClasses[size],
                variantStyles[variant],
                className,
            )}
            style={{
                ...style,
                borderTopColor: color ? 'transparent' : undefined,
                borderRightColor: color || undefined,
                borderBottomColor: color || undefined,
                borderLeftColor: color || undefined,
            }}
        />
    );
}

function FullscreenLoader({
    show = false,
    variant = 'spinner',
    size = 'lg',
    text,
    className,
    color,
}: FullscreenLoaderProps) {
    if (!show) return null;

    return (
        <div
            className={cn(
                'fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background/80 backdrop-blur-sm',
                className,
            )}
            role="status"
            aria-label="Loading"
        >
            <Loader variant={variant} size={size} color={color} />
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
            )}
        </div>
    );
}

function PageLoader({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4',
                className,
            )}
            role="status"
            aria-label="Loading page"
        >
            <Loader variant="box" size="lg" />
            <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
        </div>
    );
}

function ButtonLoader({ size = 'sm' }: { size?: LoaderSize }) {
    return <Loader variant="dots" size={size} />;
}

export { Loader, FullscreenLoader, PageLoader, ButtonLoader };
export type { LoaderProps, FullscreenLoaderProps, LoaderVariant, LoaderSize };