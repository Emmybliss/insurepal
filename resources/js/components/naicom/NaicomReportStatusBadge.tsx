import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'warning'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    generating: { variant: 'outline', label: 'Generating' },
    generated: { variant: 'default', label: 'Generated' },
    validation_failed: { variant: 'destructive', label: 'Validation Failed' },
    under_review: { variant: 'warning', label: 'Under Review' },
    approved: { variant: 'default', label: 'Approved' },
    locked: { variant: 'outline', label: 'Locked' },
    exported: { variant: 'default', label: 'Exported' },
    submitted: { variant: 'default', label: 'Submitted' },
    restated: { variant: 'secondary', label: 'Restated' },
};

export function NaicomReportStatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] ?? { variant: 'secondary' as const, label: status };

    return <Badge variant={config.variant}>{config.label}</Badge>;
}
