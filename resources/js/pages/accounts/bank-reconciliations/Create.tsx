import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface BankAccount {
    id: number;
    bank_name: string;
    account_number: string;
}

interface Props {
    bankAccounts: BankAccount[];
}

interface FormData {
    client_bank_account_id: string;
    reconciliation_date: string | null;
    closing_balance: string;
}

export default function Create({ bankAccounts }: Props) {
    const [form, setForm] = useState<FormData>({
        client_bank_account_id: '',
        reconciliation_date: null,
        closing_balance: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload: Record<string, unknown> = {
            ...form,
            client_bank_account_id: form.client_bank_account_id ? Number(form.client_bank_account_id) : undefined,
            closing_balance: form.closing_balance ? Number(form.closing_balance) : undefined,
        };

        router.post(route('bank-reconciliations.store'), payload, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => {
                setErrors(errs);
                setProcessing(false);
            },
        });
    };

    const update = (field: string, value: unknown) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Accounts', href: route('client-bank-accounts.index') },
            { title: 'Bank Reconciliations', href: route('bank-reconciliations.index') },
            { title: 'Create' },
        ]}>
            <Head title="Create Reconciliation" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={route('bank-reconciliations.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Bank Reconciliation</h1>
                        <p className="text-sm text-muted-foreground">
                            Reconcile a bank account balance with the system's calculated balance
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Reconciliation Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="client_bank_account_id">Bank Account</Label>
                                    <Select
                                        value={form.client_bank_account_id}
                                        onValueChange={(v) => update('client_bank_account_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select bank account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {bankAccounts.map((acc) => (
                                                <SelectItem key={acc.id} value={String(acc.id)}>
                                                    {acc.bank_name} - {acc.account_number}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.client_bank_account_id && (
                                        <p className="text-sm text-destructive">{errors.client_bank_account_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Reconciliation Date</Label>
                                    <DatePickerSimple
                                        value={form.reconciliation_date ? new Date(form.reconciliation_date) : undefined}
                                        onSelect={(date) => update('reconciliation_date', date ? date.toISOString().split('T')[0] : null)}
                                    />
                                    {errors.reconciliation_date && (
                                        <p className="text-sm text-destructive">{errors.reconciliation_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="closing_balance">Closing Balance (Optional)</Label>
                                    <Input
                                        id="closing_balance"
                                        type="number"
                                        step="0.01"
                                        value={form.closing_balance}
                                        onChange={(e) => update('closing_balance', e.target.value)}
                                        placeholder="Enter closing balance from bank statement"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Leave empty if you want to enter it during reconciliation
                                    </p>
                                    {errors.closing_balance && (
                                        <p className="text-sm text-destructive">{errors.closing_balance}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('bank-reconciliations.index')}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Create Reconciliation'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
