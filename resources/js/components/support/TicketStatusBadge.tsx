import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, Ticket, User, XCircle } from 'lucide-react';

interface TicketStatusBadgeProps {
    status: 'new' | 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}

const statusConfig = {
    new: {
        label: 'New',
        icon: Ticket,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        iconColor: 'text-blue-500',
    },
    open: {
        label: 'Open',
        icon: AlertCircle,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        iconColor: 'text-orange-500',
    },
    in_progress: {
        label: 'In Progress',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-500',
    },
    waiting_customer: {
        label: 'Waiting Customer',
        icon: User,
        className: 'bg-purple-100 text-purple-800 border-purple-200',
        iconColor: 'text-purple-500',
    },
    resolved: {
        label: 'Resolved',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-500',
    },
    closed: {
        label: 'Closed',
        icon: XCircle,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        iconColor: 'text-gray-500',
    },
};

const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1.5',
    lg: 'text-base px-3 py-2',
};

const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
};

export default function TicketStatusBadge({ status, size = 'md', showIcon = true }: TicketStatusBadgeProps) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <Badge variant="outline" className={`${config.className} ${sizeClasses[size]} font-medium`}>
            {showIcon && <Icon className={`${iconSizes[size]} ${config.iconColor} mr-1`} />}
            {config.label}
        </Badge>
    );
}
