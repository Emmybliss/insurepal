import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

interface ClientBankAccount {
    id: number;
    bank_name: string;
    account_name: string;
    account_number: string;
    account_type: string;
    currency: string;
    is_active: boolean;
    opening_balance: number;
    opening_balance_date: string | null;
    notes: string | null;
}

interface Props {
    account: ClientBankAccount;
}

export default function Edit({ account }: Props) {
    const [form, setForm] = useState({
        bank_name: account.bank_name,
        account_name: account.account_name,
        account_number: account.account_number,
        account_type: account.account_type,
        currency: account.currency,
        is_active: account.is_active,
        opening_balance: String(account.opening_balance),
        opening_balance_date: account.opening_balance_date,
        notes: account.notes || '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.put(route('client-bank-accounts.update', account.id), form, {
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
            { title: 'Bank Accounts', href: route('client-bank-accounts.index') },
            { title: 'Edit' },
        ]}>
            <Head title="Edit Bank Account" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link href={route('client-bank-accounts.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Bank Account</h1>
                        <p className="text-sm text-muted-foreground">{account.bank_name} - {account.account_name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Account Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="bank_name">Bank Name</Label>
                                    <Input id="bank_name" value={form.bank_name} onChange={(e) => update('bank_name', e.target.value)} />
                                    {errors.bank_name && <p className="text-sm text-destructive">{errors.bank_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_name">Account Name</Label>
                                    <Input id="account_name" value={form.account_name} onChange={(e) => update('account_name', e.target.value)} />
                                    {errors.account_name && <p className="text-sm text-destructive">{errors.account_name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_number">Account Number</Label>
                                    <Input id="account_number" value={form.account_number} onChange={(e) => update('account_number', e.target.value)} maxLength={10} />
                                    {errors.account_number && <p className="text-sm text-destructive">{errors.account_number}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="account_type">Account Type</Label>
                                    <Select value={form.account_type} onValueChange={(v) => update('account_type', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="current">Current</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="GBP">GBP</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Opening Balance</Label>
                                    <Input type="number" step="0.01" value={form.opening_balance} onChange={(e) => update('opening_balance', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Opening Balance Date</Label>
                                    <DatePickerSimple value={form.opening_balance_date} onChange={(date) => update('opening_balance_date', date)} />
                                </div>
                                <div className="flex items-center gap-4 pt-6">
                                    <Switch id="is_active" checked={form.is_active} onCheckedChange={(v) => update('is_active', v)} />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea id="notes" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('client-bank-accounts.index')}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Update Account'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
