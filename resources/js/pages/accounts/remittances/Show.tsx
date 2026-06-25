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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Banknote, RotateCcw, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface Insurer {
    id: number;
    name: string;
}

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
}

interface Allocation {
    id: number;
    allocation_type: string;
    amount: number;
    currency: string;
    allocatable_type: string;
    allocatable_id: number;
}

interface Remittance {
    id: number;
    remittance_number: string;
    client_bank_account: ClientBankAccount | null;
    insurer: Insurer | null;
    remittance_date: string;
    total_amount: number;
    currency: string;
    payment_method: string;
    reference: string | null;
    status: 'draft' | 'completed' | 'reversed' | 'failed';
    reversal_reason: string | null;
    notes: string | null;
    allocations: Allocation[];
}

interface Props {
    remittance: Remittance;
}

const statusBadge: Record<string, 'default' | 'secondary' | 'destructive' | 'warning'> = {
    draft: 'secondary',
    completed: 'default',
    reversed: 'destructive',
    failed: 'warning',
};

function formatCurrency(amount: number, currency: string = 'NGN'): string {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(amount);
}

export default function Show({ remittance }: Props) {
    const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
    const [reversalReason, setReversalReason] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleComplete = () => {
        router.post(route('remittances.complete', remittance.id), {}, { preserveScroll: true });
    };

    const handleReverse = () => {
        setProcessing(true);
        router.post(route('remittances.reverse', remittance.id), { reversal_reason: reversalReason }, {
            preserveScroll: true,
            onSuccess: () => {
                setReverseDialogOpen(false);
                setReversalReason('');
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounts', href: route('client-bank-accounts.index') },
            { title: 'Remittances', href: route('remittances.index') },
            { title: remittance.remittance_number },
        ]}>
            <Head title={remittance.remittance_number} />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('remittances.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{remittance.remittance_number}</h1>
                            <p className="text-sm text-muted-foreground">
                                {remittance.insurer?.name ?? 'Unknown Insurer'} · {remittance.remittance_date}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {remittance.status === 'draft' && (
                            <Button onClick={handleComplete}>
                                <CheckCircle className="mr-2 h-4 w-4" /> Complete
                            </Button>
                        )}
                        {remittance.status === 'completed' && (
                            <Dialog open={reverseDialogOpen} onOpenChange={setReverseDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <RotateCcw className="mr-2 h-4 w-4" /> Reverse
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Reverse Remittance</DialogTitle>
                                        <DialogDescription>
                                            Are you sure you want to reverse {remittance.remittance_number} for{' '}
                                            {formatCurrency(remittance.total_amount, remittance.currency)}?
                                            This action cannot be undone.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                        <label htmlFor="reversal_reason" className="text-sm font-medium">
                                            Reversal Reason
                                        </label>
                                        <Textarea
                                            id="reversal_reason"
                                            value={reversalReason}
                                            onChange={(e) => setReversalReason(e.target.value)}
                                            placeholder="Provide a reason for the reversal..."
                                            rows={3}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setReverseDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleReverse}
                                            disabled={processing || !reversalReason.trim()}
                                        >
                                            {processing ? 'Reversing...' : 'Confirm Reversal'}
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
                            <CardTitle className="text-sm font-medium">Remittance Info</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-2xl font-bold">
                                <Banknote className="h-6 w-6 text-muted-foreground" />
                                {remittance.remittance_number}
                            </div>
                            <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Date:</span> {remittance.remittance_date}</p>
                                <p><span className="text-muted-foreground">Method:</span> <span className="capitalize">{remittance.payment_method.replace('_', ' ')}</span></p>
                                <p><span className="text-muted-foreground">Reference:</span> {remittance.reference ?? '—'}</p>
                            </div>
                            <Badge variant={statusBadge[remittance.status]}>
                                {remittance.status.charAt(0).toUpperCase() + remittance.status.slice(1)}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Amount</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-bold">
                                {formatCurrency(remittance.total_amount, remittance.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">{remittance.currency}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Insurer</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-lg font-semibold">{remittance.insurer?.name ?? '—'}</p>
                            <p className="text-sm text-muted-foreground">Insurer</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Bank Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {remittance.client_bank_account ? (
                            <div className="space-y-1 text-sm">
                                <p><span className="text-muted-foreground">Bank:</span> {remittance.client_bank_account.bank_name}</p>
                                <p><span className="text-muted-foreground">Account:</span> {remittance.client_bank_account.account_name}</p>
                                <p><span className="text-muted-foreground">Number:</span> <span className="font-mono">{remittance.client_bank_account.account_number}</span></p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No bank account linked</p>
                        )}
                    </CardContent>
                </Card>

                {remittance.allocations.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Allocations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Source</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                                            <th className="px-4 py-3 text-left text-sm font-medium">Currency</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {remittance.allocations.map((alloc) => (
                                            <tr key={alloc.id} className="border-b last:border-0">
                                                <td className="px-4 py-3 capitalize">{alloc.allocation_type.replace('_', ' ')}</td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {alloc.allocatable_type} #{alloc.allocatable_id}
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">
                                                    {formatCurrency(alloc.amount, alloc.currency)}
                                                </td>
                                                <td className="px-4 py-3">{alloc.currency}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {remittance.notes && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{remittance.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {remittance.reversal_reason && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Reversal Reason</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{remittance.reversal_reason}</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
