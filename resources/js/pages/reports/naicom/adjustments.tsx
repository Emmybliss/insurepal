import { NaicomReportStatusBadge } from '@/components/naicom/NaicomReportStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Shield } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
}

interface Adjustment {
    id: number;
    form_type: string;
    field: string | null;
    calculated_value: string | null;
    adjusted_value: string;
    reason: string;
    status: string;
    created_by: User | null;
    reviewed_by: User | null;
    approved_by: User | null;
    report_line_id: number | null;
    created_at: string;
}

interface ReportRun {
    id: number;
    reporting_year: number;
    reporting_half: 'H1' | 'H2';
    status: string;
}

interface Props {
    run: ReportRun;
    adjustments: Adjustment[];
}

const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    draft: { variant: 'secondary', label: 'Draft' },
    reviewed: { variant: 'default', label: 'Reviewed' },
    approved: { variant: 'default', label: 'Approved' },
    rejected: { variant: 'destructive', label: 'Rejected' },
};

export default function Adjustments({ run, adjustments }: Props) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formType, setFormType] = useState('7.2B');
    const [field, setField] = useState('');
    const [adjustedValue, setAdjustedValue] = useState('');
    const [reason, setReason] = useState('');

    const { props } = usePage<{ flash?: { success?: string; error?: string } }>();

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!adjustedValue || !reason || reason.length < 10) return;

        setSubmitting(true);
        router.post(route('reports.naicom.adjustments.store', run.id), {
            form_type: formType,
            field,
            adjusted_value: adjustedValue,
            reason,
        } as Record<string, string>, {
            preserveScroll: true,
            onSuccess: () => {
                setOpen(false);
                setFormType('7.2B');
                setField('');
                setAdjustedValue('');
                setReason('');
                setSubmitting(false);
            },
            onError: () => {
                setSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Reports', href: route('reports.index') },
            { title: 'NAICOM Returns', href: route('reports.naicom.index') },
            { title: `${run.reporting_year} ${run.reporting_half}`, href: route('reports.naicom.show', run.id) },
            { title: 'Adjustments', href: '#' },
        ]}>
            <Head title="Adjustments" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.naicom.show', run.id)}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">Adjustments</h1>
                                <NaicomReportStatusBadge status={run.status} />
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {run.reporting_year} {run.reporting_half === 'H1' ? 'First Half (Jan–Jun)' : 'Second Half (Jul–Dec)'}
                            </p>
                        </div>
                    </div>

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" /> New Adjustment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Create Adjustment</DialogTitle>
                                    <DialogDescription>
                                        Adjust a calculated value on this report. Provide a reason for the change.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="form_type">Form</Label>
                                        <Select value={formType} onValueChange={setFormType}>
                                            <SelectTrigger id="form_type">
                                                <SelectValue placeholder="Select form" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="7.2A">7.2A — Assets & Liabilities</SelectItem>
                                                <SelectItem value="7.2B">7.2B — Business Generated</SelectItem>
                                                <SelectItem value="7.2C">7.2C — Remittances</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="field">Field (optional)</Label>
                                        <Input
                                            id="field"
                                            value={field}
                                            onChange={(e) => setField(e.target.value)}
                                            placeholder="e.g., premium_amount, commission_earned"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adjusted_value">Adjusted Value *</Label>
                                        <Input
                                            id="adjusted_value"
                                            type="number"
                                            step="0.01"
                                            value={adjustedValue}
                                            onChange={(e) => setAdjustedValue(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Reason * (min. 10 characters)</Label>
                                        <Textarea
                                            id="reason"
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            rows={3}
                                            required
                                            minLength={10}
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting || !adjustedValue || reason.length < 10}>
                                        {submitting ? 'Saving...' : 'Save Adjustment'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Adjustments</CardTitle>
                        <CardDescription>
                            {adjustments.length} adjustment{adjustments.length !== 1 ? 's' : ''} recorded
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {adjustments.length === 0 ? (
                            <div className="py-12 text-center">
                                <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="mb-2 font-medium">No adjustments yet</p>
                                <p className="text-sm text-muted-foreground">
                                    Click "New Adjustment" to manually adjust a value on this report.
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left text-sm font-medium">Form</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Field</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Original</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Adjusted</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Reason</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Created By</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adjustments.map((adj) => {
                                            const config = statusConfig[adj.status] ?? { variant: 'secondary' as const, label: adj.status };

                                            return (
                                                <tr key={adj.id} className="border-b last:border-0 hover:bg-muted/50">
                                                    <td className="px-4 py-3 text-sm">{adj.form_type}</td>
                                                    <td className="px-4 py-3 text-sm font-mono">{adj.field ?? '—'}</td>
                                                    <td className="px-4 py-3 text-right text-sm">{adj.calculated_value ? Number(adj.calculated_value).toLocaleString() : '—'}</td>
                                                    <td className="px-4 py-3 text-right text-sm font-medium">{Number(adj.adjusted_value).toLocaleString()}</td>
                                                    <td className="max-w-xs truncate px-4 py-3 text-sm" title={adj.reason}>{adj.reason}</td>
                                                    <td className="px-4 py-3"><Badge variant={config.variant}>{config.label}</Badge></td>
                                                    <td className="px-4 py-3 text-sm">{adj.created_by?.name ?? '—'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
