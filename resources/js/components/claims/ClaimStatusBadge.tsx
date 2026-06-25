import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ClaimStatus } from '@/types/claim';

interface ClaimStatusBadgeProps {
    status: ClaimStatus;
    className?: string;
}

const statusConfig: Record<ClaimStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
    draft: {
        label: 'Draft',
        variant: 'outline',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    submitted: {
        label: 'Submitted',
        variant: 'default',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    under_review: {
        label: 'Under Review',
        variant: 'default',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    info_requested: {
        label: 'Info Requested',
        variant: 'default',
        className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    approved: {
        label: 'Approved',
        variant: 'default',
        className: 'bg-green-100 text-green-800 border-green-300',
    },
    rejected: {
        label: 'Rejected',
        variant: 'destructive',
        className: 'bg-red-100 text-red-800 border-red-300',
    },
    settled: {
        label: 'Settled',
        variant: 'default',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    closed: {
        label: 'Closed',
        variant: 'secondary',
        className: 'bg-gray-100 text-gray-600 border-gray-300',
    },
};

export function ClaimStatusBadge({ status, className }: ClaimStatusBadgeProps) {
    const config = statusConfig[status];

    return (
        <Badge variant={config.variant} className={cn(config.className, className)}>
            {config.label}
        </Badge>
    );
}
