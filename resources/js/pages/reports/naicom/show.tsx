import { NaicomForm72ATable } from '@/components/naicom/NaicomForm72ATable';
import { NaicomForm72BTable } from '@/components/naicom/NaicomForm72BTable';
import { NaicomForm72CTable } from '@/components/naicom/NaicomForm72CTable';
import { NaicomReportStatusBadge } from '@/components/naicom/NaicomReportStatusBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Download, FileSpreadsheet, Lock, Pencil, RotateCcw, UserCheck } from 'lucide-react';
import { useState } from 'react';

interface PeriodicSummary {
    month: number;
    month_name: string;
    count: number;
    total_gross_premium?: number;
    total_commission?: number;
    total_earned?: number;
    total_deferred?: number;
    total_received?: number;
    premium_due?: number;
    premium_remitted?: number;
    total_outstanding_premium?: number;
    total_outstanding_commission?: number;
}

interface ReportRun {
    id: number;
    reporting_year: number;
    reporting_half: 'H1' | 'H2';
    status: string;
    generated_by: { id: number; name: string } | null;
    approved_by: { id: number; name: string } | null;
    approved_at: string | null;
    created_at: string;
    metadata: Record<string, unknown> | null;
}

interface Props {
    run: ReportRun;
    form: string;
    lines: Record<string, unknown>[];
    monthlySummaries: PeriodicSummary[];
    hasAdjustments: boolean;
    errors?: Record<string, string>;
}

function ConfirmDialog({ open, onOpenChange, title, description, action, onConfirm, loading }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    title: string;
    description: string;
    action: string;
    onConfirm: () => void;
    loading: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : action}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function Show({ run, form, lines, monthlySummaries, hasAdjustments }: Props) {
    const [confirm, setConfirm] = useState<{ title: string; description: string; action: string; actionName: string } | null>(null);
    const [processing, setProcessing] = useState(false);

    const periodLabel = `${run.reporting_year} ${run.reporting_half === 'H1' ? 'First Half (Jan–Jun)' : 'Second Half (Jul–Dec)'}`;
    const generating = run.status === 'generating';
    const isDraft = run.status === 'generated';
    const isUnderReview = run.status === 'under_review';
    const isApproved = run.status === 'approved';
    const isLocked = ['locked', 'approved', 'exported', 'submitted'].includes(run.status);
    const canMutate = !isLocked && run.status !== 'generating' && run.status !== 'restated';
    const showAdjustments = !generating;

    const handleConfirmAction = () => {
        if (!confirm) return;
        setProcessing(true);
        router.post(route(`reports.naicom.${confirm.actionName}`, run.id), {} as Record<string, string>, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setConfirm(null);
            },
        });
    };

    const handleAction = (action: string, data?: Record<string, unknown>) => {
        if (action === 'export') {
            const form = document.createElement('form');
            form.action = route('reports.naicom.export', { reportRun: run.id, format: data?.format as string });
            form.method = 'POST';
            const csrf = document.createElement('input');
            csrf.type = 'hidden';
            csrf.name = '_token';
            csrf.value = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
            form.appendChild(csrf);
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            return;
        }

        router.post(route(`reports.naicom.${action}`, run.id), data as Record<string, string> | undefined, { preserveScroll: true });
    };

    const handleTabChange = (value: string) => {
        router.get(route('reports.naicom.show', { reportRun: run.id, form: value }), {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Reports', href: route('reports.index') },
            { title: 'NAICOM Returns', href: route('reports.naicom.index') },
            { title: periodLabel, href: '#' },
        ]}>
            <Head title={`NAICOM ${periodLabel}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('reports.naicom.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold">{periodLabel}</h1>
                                <NaicomReportStatusBadge status={run.status} />
                                {isLocked && (
                                    <Badge variant="outline" className="gap-1">
                                        <Lock className="h-3 w-3" /> Locked
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Generated {new Date(run.created_at).toLocaleDateString()}
                                {run.generated_by && ` by ${run.generated_by.name}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isDraft && (
                            <Button onClick={() => setConfirm({
                                title: 'Submit for Review',
                                description: 'Send this report for compliance review. This will change the status to "Under Review".',
                                action: 'Submit for Review',
                                actionName: 'submit-review',
                            })}>
                                <UserCheck className="mr-2 h-4 w-4" /> Submit for Review
                            </Button>
                        )}
                        {isUnderReview && (
                            <Button onClick={() => setConfirm({
                                title: 'Approve Report',
                                description: 'Approve this NAICOM report. Approved reports can be locked to prevent further changes.',
                                action: 'Approve',
                                actionName: 'approve',
                            })}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </Button>
                        )}
                        {isApproved && (
                            <Button onClick={() => setConfirm({
                                title: 'Lock Report',
                                description: 'Lock this report to prevent any further changes or adjustments.',
                                action: 'Lock',
                                actionName: 'lock',
                            })}>
                                <Lock className="mr-2 h-4 w-4" /> Lock
                            </Button>
                        )}
                        {canMutate && (
                            <Button variant="outline" onClick={() => setConfirm({
                                title: 'Restate Report',
                                description: 'Create a new version of this report. The current version will be marked as "Restated".',
                                action: 'Restate',
                                actionName: 'restate',
                            })}>
                                <RotateCcw className="mr-2 h-4 w-4" /> Restate
                            </Button>
                        )}
                        {showAdjustments && (
                            <Link href={route('reports.naicom.adjustments', run.id)}>
                                <Button variant="outline">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Adjustments
                                    {hasAdjustments && <Badge variant="secondary" className="ml-2">{'!'}</Badge>}
                                </Button>
                            </Link>
                        )}
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('export', { format: 'xlsx-72b' })}
                            >
                                <FileSpreadsheet className="mr-1 h-4 w-4" /> 7.2B
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('export', { format: 'xlsx-72c' })}
                            >
                                <FileSpreadsheet className="mr-1 h-4 w-4" /> 7.2C
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction('export', { format: 'xlsx-72a' })}
                            >
                                <FileSpreadsheet className="mr-1 h-4 w-4" /> 7.2A
                            </Button>
                        </div>
                    </div>
                </div>

                {generating && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="mb-4">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                            </div>
                            <p className="font-medium">Generating report data...</p>
                            <p className="text-sm text-muted-foreground">This may take a moment for large datasets.</p>
                        </CardContent>
                    </Card>
                )}

                {run.approved_by && (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
                        <CheckCircle className="h-4 w-4" />
                        Approved by {run.approved_by.name} on {new Date(run.approved_at ?? '').toLocaleDateString()}
                    </div>
                )}

                <Tabs value={form} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="7.2B">7.2B — Business Generated</TabsTrigger>
                        <TabsTrigger value="7.2A">7.2A — Assets & Liabilities</TabsTrigger>
                        <TabsTrigger value="7.2C">7.2C — Remittances</TabsTrigger>
                    </TabsList>

                    <TabsContent value="7.2B" className="mt-6">
                        <NaicomForm72BTable
                            lines={lines as any}
                            monthlySummaries={monthlySummaries}
                        />
                    </TabsContent>

                    <TabsContent value="7.2A" className="mt-6">
                        <NaicomForm72ATable
                            lines={lines as any}
                            monthlySummaries={monthlySummaries}
                        />
                    </TabsContent>

                    <TabsContent value="7.2C" className="mt-6">
                        <NaicomForm72CTable
                            lines={lines as any}
                            monthlySummaries={monthlySummaries}
                        />
                    </TabsContent>
                </Tabs>

                {run.metadata?.generation_error ? (
                    <Card className="border-destructive">
                        <CardHeader>
                            <CardTitle className="text-destructive">Generation Error</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-destructive">{String(run.metadata.generation_error)}</p>
                        </CardContent>
                    </Card>
                ) : null}

                {confirm && (
                    <ConfirmDialog
                        open={true}
                        onOpenChange={(v) => !v && setConfirm(null)}
                        title={confirm.title}
                        description={confirm.description}
                        action={confirm.action}
                        onConfirm={handleConfirmAction}
                        loading={processing}
                    />
                )}
            </div>
        </AppLayout>
    );
}
