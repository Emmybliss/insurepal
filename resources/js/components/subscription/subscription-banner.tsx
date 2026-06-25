import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/use-subscription';
import { router } from '@inertiajs/react';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export function SubscriptionBanner() {
    const { isExpired, isReadOnly, warningMessage, warningLevel } = useSubscription();

    if (!warningMessage) return null;

    return (
        <div
            className={`flex w-full items-center justify-between px-4 py-3 text-sm ${
                warningLevel === 'destructive' || isExpired
                    ? 'border-b border-destructive/20 bg-destructive/10 text-destructive'
                    : 'border-b border-yellow-500/20 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
            }`}
        >
            <div className="flex items-center gap-2">
                {warningLevel === 'destructive' || isExpired ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                <span>
                    {isReadOnly && (
                        <Badge variant="destructive" className="mr-2 text-[10px] uppercase">
                            Read-Only Mode
                        </Badge>
                    )}
                    {warningMessage}
                </span>
            </div>

            <Button
                variant={warningLevel === 'destructive' || isExpired ? 'destructive' : 'outline'}
                size="sm"
                className={warningLevel === 'warning' ? 'border-yellow-500/50 hover:bg-yellow-500/20' : ''}
                onClick={() => router.visit(route('settings.billing'))}
            >
                {isExpired ? 'Manage Billing' : 'Renew Now'}
            </Button>
        </div>
    );
}
