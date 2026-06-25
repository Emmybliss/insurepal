import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../ui/button';

type NavigationButtonsProps = {
    fallbackUrl?: string;
    className?: string;
};

const NavigationButtons = ({ fallbackUrl = '/dashboard', className = '' }: NavigationButtonsProps) => {
    const [canGoBack, setCanGoBack] = useState(false);
    const [canGoForward, setCanGoForward] = useState(false);

    useEffect(() => {
        const updateState = () => {
            // Approximation only: you can go back if history length > 1
            setCanGoBack(window.history.length > 1);

            // Forward state detection is not exposed in History API.
            // We’ll keep it active; but prevent navigation if it fails.
            setCanGoForward(true); // Enable visually, fallback logic handles actual navigation
        };

        updateState();
        window.addEventListener('popstate', updateState);

        return () => window.removeEventListener('popstate', updateState);
    }, []);

    const goBack = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            router.visit(fallbackUrl);
        }
    };

    const goForward = () => {
        // Try going forward — if it doesn't exist, nothing will happen
        window.history.forward();
    };

    return (
        <div className={`mb-2 flex items-center gap-2 ${className}`}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={goBack}
                        disabled={!canGoBack}
                        className={`flex items-center gap-1 rounded px-4 py-2 transition ${canGoBack ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Back</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        onClick={goForward}
                        disabled={!canGoForward}
                        className={`flex items-center gap-1 rounded px-4 py-2 transition ${
                            canGoForward ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                    >
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Forward</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
};

export default NavigationButtons;
