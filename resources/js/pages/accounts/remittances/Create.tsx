import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

interface Insurer {
    id: number;
    name: string;
}

interface Props {
    bankAccounts: BankAccount[];
    insurers: Insurer[];
    nextRemittanceNumber: string;
}

const currencyOptions = [
    { value: 'NGN', label: 'NGN - Nigerian Naira' },
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'EUR', label: 'EUR - Euro' },
];

const paymentMethods = [
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'cash', label: 'Cash' },
    { value: 'online', label: 'Online Payment' },
];

interface FormData {
    client_bank_account_id: string;
    insurer_id: string;
    remittance_date: string | null;
    total_amount: string;
    currency: string;
    payment_method: string;
    reference: string;
    notes: string;
}

export default function Create({ bankAccounts, insurers, nextRemittanceNumber }: Props) {
    const [form, setForm] = useState<FormData>({
        client_bank_account_id: '',
        insurer_id: '',
        remittance_date: null,
        total_amount: '',
        currency: 'NGN',
        payment_method: 'bank_transfer',
        reference: '',
        notes: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload: Record<string, unknown> = {
            ...form,
            client_bank_account_id: form.client_bank_account_id ? Number(form.client_bank_account_id) : undefined,
            insurer_id: form.insurer_id ? Number(form.insurer_id) : undefined,
            total_amount: form.total_amount ? Number(form.total_amount) : undefined,
        };

        router.post(route('remittances.store'), payload, {
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
            { title: 'Remittances', href: route('remittances.index') },
            { title: 'Create' },
        ]}>
            <Head title="Create Remittance" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={route('remittances.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Remittance</h1>
                        <p className="text-sm text-muted-foreground">
                            Record a premium remittance to an insurer. Ref: {nextRemittanceNumber}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Remittance Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="client_bank_account_id">Client Bank Account</Label>
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
                                    <Label htmlFor="insurer_id">Insurer</Label>
                                    <Select
                                        value={form.insurer_id}
                                        onValueChange={(v) => update('insurer_id', v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select insurer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {insurers.map((ins) => (
                                                <SelectItem key={ins.id} value={String(ins.id)}>
                                                    {ins.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.insurer_id && (
                                        <p className="text-sm text-destructive">{errors.insurer_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>Remittance Date</Label>
                                    <DatePickerSimple
                                        value={form.remittance_date ? new Date(form.remittance_date) : undefined}
                                        onSelect={(date) => update('remittance_date', date ? date.toISOString().split('T')[0] : null)}
                                    />
                                    {errors.remittance_date && (
                                        <p className="text-sm text-destructive">{errors.remittance_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="total_amount">Total Amount</Label>
                                    <Input
                                        id="total_amount"
                                        type="number"
                                        step="0.01"
                                        value={form.total_amount}
                                        onChange={(e) => update('total_amount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {errors.total_amount && (
                                        <p className="text-sm text-destructive">{errors.total_amount}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencyOptions.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_method">Payment Method</Label>
                                    <Select value={form.payment_method} onValueChange={(v) => update('payment_method', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((pm) => (
                                                <SelectItem key={pm.value} value={pm.value}>
                                                    {pm.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.payment_method && (
                                        <p className="text-sm text-destructive">{errors.payment_method}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference</Label>
                                    <Input
                                        id="reference"
                                        value={form.reference}
                                        onChange={(e) => update('reference', e.target.value)}
                                        placeholder="Payment reference (optional)"
                                    />
                                    {errors.reference && <p className="text-sm text-destructive">{errors.reference}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={form.notes}
                                    onChange={(e) => update('notes', e.target.value)}
                                    placeholder="Optional notes about this remittance"
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('remittances.index')}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Create Remittance'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
