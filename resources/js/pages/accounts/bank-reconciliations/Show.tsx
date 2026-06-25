import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Wand2 } from 'lucide-react';
import { useState } from 'react';

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
}

interface ReconciliationLine {
    id: number;
    source_type: string;
    source_id: number;
    type: 'debit' | 'credit';
    amount: number;
    matched: boolean;
    matched_at: string | null;
    notes: string | null;
}

interface Reconciliation {
    id: number;
    client_bank_account: ClientBankAccount | null;
    reconciliation_date: string;
    closing_balance: number | null;
    calculated_balance: number;
    difference: number | null;
    status: 'draft' | 'reconciled' | 'difference_identified';
    reconciled_at: string | null;
    reconciled_by: string | null;
    notes: string | null;
    lines: ReconciliationLine[];
}

interface Props {
    reconciliation: Reconciliation;
}

const statusBadge: Record<string, 'default' | 'secondary' | 'warning'> = {
    draft: 'secondary',
    reconciled: 'default',
    difference_identified: 'warning',
};

function formatCurrency(amount: number | null): string {
    if (amount === null) return '—';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
}

export default function Show({ reconciliation }: Props) {
    const [reconcileDialogOpen, setReconcileDialogOpen] = useState(false);
    const [actualClosingBalance, setActualClosingBalance] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleAutoMatch = () => {
        router.post(route('bank-reconciliations.match-lines', reconciliation.id), {}, { preserveScroll: true });
    };

    const handleReconcile = () => {
        setProcessing(true);
        const payload: Record<string, unknown> = {
            actual_closing_balance: actualClosingBalance ? Number(actualClosingBalance) : undefined,
        };
        router.post(route('bank-reconciliations.reconcile', reconciliation.id), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setReconcileDialogOpen(false);
                setActualClosingBalance('');
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const canReconcile = reconciliation.status === 'draft' || reconciliation.status === 'difference_identified';

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounts', href: route('client-bank-accounts.index') },
            { title: 'Bank Reconciliations', href: route('bank-reconciliations.index') },
            { title: `#${reconciliation.id}` },
        ]}>
            <Head title={`Reconciliation #${reconciliation.id}`} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('bank-reconciliations.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Reconciliation #{reconciliation.id}</h1>
                            <p className="text-sm text-muted-foreground">
                                {reconciliation.client_bank_account?.bank_name ?? 'Unknown Bank'} · {reconciliation.reconciliation_date}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {reconciliation.status === 'draft' && (
                            <Button variant="secondary" onClick={handleAutoMatch}>
                                <Wand2 className="mr-2 h-4 w-4" /> Auto-match Lines
                            </Button>
                        )}
                        {canReconcile && (
                            <Dialog open={reconcileDialogOpen} onOpenChange={setReconcileDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button>
                                        <CheckCircle className="mr-2 h-4 w-4" /> Reconcile
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Complete Reconciliation</DialogTitle>
                                        <DialogDescription>
                                            {reconciliation.status === 'difference_identified'
                                                ? 'A difference was identified. Provide the actual closing balance from the bank statement to proceed.'
                                                : 'Are you sure you want to mark this reconciliation as complete?'}
                                        </DialogDescription>
                                    </DialogHeader>

                                    {reconciliation.status === 'difference_identified' && (
                                        <div className="space-y-4">
                                            <div className="rounded-md border bg-muted/50 p-4 space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Current Closing Balance</span>
                                                    <span className="font-mono font-medium">{formatCurrency(reconciliation.closing_balance)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Calculated Balance</span>
                                                    <span className="font-mono font-medium">{formatCurrency(reconciliation.calculated_balance)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Difference</span>
                                                    <span className="font-mono font-medium text-destructive">{formatCurrency(reconciliation.difference)}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="actual_closing_balance">Actual Closing Balance</Label>
                                                <Input
                                                    id="actual_closing_balance"
                                                    type="number"
                                                    step="0.01"
                                                    value={actualClosingBalance}
                                                    onChange={(e) => setActualClosingBalance(e.target.value)}
                                                    placeholder="Enter the actual closing balance"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setReconcileDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleReconcile}
                                            disabled={processing || (reconciliation.status === 'difference_identified' && !actualClosingBalance)}
                                        >
                                            {processing ? 'Reconciling...' : 'Confirm Reconciliation'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Reconciliation Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Badge variant={statusBadge[reconciliation.status]}>
                                {reconciliation.status === 'difference_identified'
                                    ? 'Difference Identified'
                                    : reconciliation.status.charAt(0).toUpperCase() + reconciliation.status.slice(1)}
                            </Badge>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Date:</span> {reconciliation.reconciliation_date}</p>
                                <p><span className="text-muted-foreground">Reconciled By:</span> {reconciliation.reconciled_by ?? '—'}</p>
                                <p><span className="text-muted-foreground">Reconciled At:</span> {reconciliation.reconciled_at ?? '—'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Bank Account</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {reconciliation.client_bank_account ? (
                                <div className="space-y-1 text-sm">
                                    <p><span className="text-muted-foreground">Bank:</span> {reconciliation.client_bank_account.bank_name}</p>
                                    <p><span className="text-muted-foreground">Account:</span> {reconciliation.client_bank_account.account_name}</p>
                                    <p><span className="text-muted-foreground">Number:</span> <span className="font-mono">{reconciliation.client_bank_account.account_number}</span></p>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">No bank account linked</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Balances</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Closing Balance</span>
                                <span className="font-mono font-medium">{formatCurrency(reconciliation.closing_balance)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Calculated Balance</span>
                                <span className="font-mono font-medium">{formatCurrency(reconciliation.calculated_balance)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-3">
                                <span className="text-muted-foreground">Difference</span>
                                <span className={`font-mono font-medium ${reconciliation.difference !== null && reconciliation.difference !== 0 ? 'text-destructive' : ''}`}>
                                    {formatCurrency(reconciliation.difference)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Reconciliation Lines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">Matched</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reconciliation.lines.map((line) => (
                                        <tr key={line.id} className="border-b last:border-0">
                                            <td className="px-4 py-3 capitalize">{line.source_type.replace('_', ' ')}</td>
                                            <td className="px-4 py-3 capitalize">
                                                <span className={line.type === 'debit' ? 'text-destructive' : 'text-emerald-600'}>
                                                    {line.type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono">{formatCurrency(line.amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {line.matched ? (
                                                    <Badge variant="default">Matched</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Unmatched</Badge>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {reconciliation.lines.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                                No lines found for this reconciliation.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {reconciliation.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reconciliation.notes}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
