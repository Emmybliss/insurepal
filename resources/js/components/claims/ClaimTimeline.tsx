import { formatDateTime } from '@/lib/utils';
import { Claim } from '@/types/claim';
import { AlertCircle, CheckCircle, Clock, FileCheck, Lock, XCircle } from 'lucide-react';

interface ClaimTimelineProps {
    claim: Claim;
}

const statusIcons = {
    draft: Clock,
    submitted: FileCheck,
    under_review: Clock,
    info_requested: AlertCircle,
    approved: CheckCircle,
    rejected: XCircle,
    settled: CheckCircle,
    closed: Lock,
};

const statusColors = {
    draft: 'text-gray-500',
    submitted: 'text-blue-500',
    under_review: 'text-yellow-500',
    info_requested: 'text-orange-500',
    approved: 'text-green-500',
    rejected: 'text-red-500',
    settled: 'text-purple-500',
    closed: 'text-gray-500',
};

export function ClaimTimeline({ claim }: ClaimTimelineProps) {
    const timeline = [
        {
            status: 'draft',
            label: 'Created',
            timestamp: claim.created_at,
            completed: true,
        },
        {
            status: 'submitted',
            label: 'Submitted',
            timestamp: claim.submitted_at,
            completed: !!claim.submitted_at,
        },
        {
            status: 'under_review',
            label: 'Under Review',
            timestamp: claim.reviewed_at,
            completed: !!claim.reviewed_at,
        },
        {
            status: claim.status === 'rejected' ? 'rejected' : 'approved',
            label: claim.status === 'rejected' ? 'Rejected' : 'Approved',
            timestamp: claim.approved_at || claim.rejected_at,
            completed: !!claim.approved_at || !!claim.rejected_at,
        },
    ];

    if (claim.status === 'approved' || claim.status === 'settled' || claim.status === 'closed') {
        timeline.push({
            status: 'settled',
            label: 'Settled',
            timestamp: claim.settled_at,
            completed: !!claim.settled_at,
        });
    }

    if (claim.status === 'closed') {
        timeline.push({
            status: 'closed',
            label: 'Closed',
            timestamp: claim.closed_at,
            completed: !!claim.closed_at,
        });
    }

    return (
        <div className="relative">
            {timeline.map((step, index) => {
                const Icon = statusIcons[step.status as keyof typeof statusIcons];
                const isLast = index === timeline.length - 1;

                return (
                    <div key={index} className="relative flex gap-4 pb-8">
                        {/* Connector Line */}
                        {!isLast && <div className={`absolute top-8 left-4 h-full w-0.5 ${step.completed ? 'bg-primary' : 'bg-gray-200'}`} />}

                        {/* Icon */}
                        <div
                            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                                step.completed ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-gray-400'
                            }`}
                        >
                            <Icon className="h-4 w-4" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5">
                            <p className={`font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>{step.label}</p>
                            {step.timestamp && <p className="text-sm text-muted-foreground">{formatDateTime(step.timestamp)}</p>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
