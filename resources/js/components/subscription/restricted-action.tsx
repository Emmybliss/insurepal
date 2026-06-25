import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSubscription } from '@/hooks/use-subscription';
import { Lock } from 'lucide-react';
import React from 'react';

interface RestrictedActionProps {
    children: React.ReactElement;
    fallbackMessage?: string;
    showIcon?: boolean;
}

export function RestrictedAction({ children, fallbackMessage, showIcon = true }: RestrictedActionProps) {
    const { isReadOnly } = useSubscription();

    if (!isReadOnly) return children;

    const message = fallbackMessage || 'Your subscription has expired. Please renew to perform this action.';

    // We clone the child element to forcefully disable it and intercept clicks
    const clonedChild = React.cloneElement(children as any, {
        disabled: true,
        onClick: (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
        },
        className: `${(children.props as any).className || ''} opacity-50 cursor-not-allowed select-none relative`.trim(),
        children: (
            <>
                {(children.props as any).children}
                {showIcon && <Lock className="ml-2 inline-block h-3.5 w-3.5" />}
            </>
        ),
    });

    return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    <span className="inline-block cursor-not-allowed">{clonedChild}</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-[250px] bg-destructive text-center font-medium text-destructive-foreground">
                    <p>{message}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
