import { usePage } from '@inertiajs/react';
import { useMemo } from 'react';

export function useSubscription() {
    const { auth } = usePage<any>().props;
    const tenant_subscription = auth?.tenant_subscription;

    return useMemo(() => {
        if (!tenant_subscription) {
            return {
                isExpired: false,
                isReadOnly: false,
                warningMessage: null,
                warningLevel: null as 'warning' | 'destructive' | null,
            };
        }

        const { is_expired, expires_at, has_auto_renewal, billing_cycle } = tenant_subscription;

        if (!expires_at) {
            return { isExpired: false, isReadOnly: false, warningMessage: null, warningLevel: null };
        }

        const expiryDate = new Date(expires_at);
        const now = new Date();
        const diffMs = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let warningMessage = null;
        let warningLevel: 'warning' | 'destructive' | null = null;
        const isReadOnly = is_expired;

        if (is_expired) {
            warningMessage =
                'Your subscription has expired. You are currently in read-only mode. Please renew your subscription to restore full access.';
            warningLevel = 'destructive';
        } else if (diffDays <= 0) {
            warningMessage = `Your subscription expires today! Renew now to prevent interruption.`;
            warningLevel = 'destructive';
        } else if (has_auto_renewal) {
            // Auto-renewal handle itself, typically no urgent warning needed unless close, but client may want just a small info tooltip instead
            // To fulfill the requirement we can still show a gentle warning.
            if (diffDays <= 3) {
                warningMessage = `Your subscription will auto-renew in ${diffDays} day${diffDays > 1 ? 's' : ''}. Ensure your payment method is up to date.`;
                warningLevel = 'warning';
            }
        } else {
            // No auto renewal - Evaluate exactly based on billing cycle
            if (billing_cycle === 'monthly') {
                if (diffDays <= 7) {
                    warningMessage = `Your monthly subscription expires in ${diffDays} day${diffDays > 1 ? 's' : ''}. Please renew to prevent interruption.`;
                    warningLevel = 'warning';
                }
            } else if (billing_cycle === 'yearly') {
                if (diffDays <= 31 && diffDays > 28) {
                    warningMessage = 'Your yearly subscription expires in 1 month. Consider renewing soon.';
                    warningLevel = 'warning';
                } else if (diffDays <= 14 && diffDays > 7) {
                    warningMessage = 'Your yearly subscription expires in 2 weeks. Please renew soon.';
                    warningLevel = 'warning';
                } else if (diffDays <= 7) {
                    warningMessage = `Your yearly subscription expires in ${diffDays} day${diffDays > 1 ? 's' : ''}. Renew now to prevent interruption.`;
                    warningLevel = 'destructive'; // Escalate since no auto renewal
                }
            }
        }

        return {
            isExpired: is_expired,
            isReadOnly,
            warningMessage,
            warningLevel,
            expiresAt: expiryDate,
        };
    }, [tenant_subscription]);
}
