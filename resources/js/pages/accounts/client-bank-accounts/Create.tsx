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

export default function Create() {
    const [form, setForm] = useState({
        bank_name: '',
        account_name: '',
        account_number: '',
        account_type: 'current',
        currency: 'NGN',
        is_active: true,
        opening_balance: '0',
        opening_balance_date: null as string | null,
        notes: '',
    });
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        router.post(route('client-bank-accounts.store'), form, {
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
            { title: 'Create' },
        ]}>
            <Head title="Create Bank Account" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center gap-4">
                    <Link href={route('client-bank-accounts.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Create Bank Account</h1>
                        <p className="text-sm text-muted-foreground">Add a new clients' bank account for premium and claim collections</p>
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
                                    <Input
                                        id="bank_name"
                                        value={form.bank_name}
                                        onChange={(e) => update('bank_name', e.target.value)}
                                        placeholder="e.g., GTBank, Access Bank"
                                    />
                                    {errors.bank_name && <p className="text-sm text-destructive">{errors.bank_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_name">Account Name</Label>
                                    <Input
                                        id="account_name"
                                        value={form.account_name}
                                        onChange={(e) => update('account_name', e.target.value)}
                                        placeholder="Insurance Brokers Ltd Clients Account"
                                    />
                                    {errors.account_name && <p className="text-sm text-destructive">{errors.account_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_number">Account Number</Label>
                                    <Input
                                        id="account_number"
                                        value={form.account_number}
                                        onChange={(e) => update('account_number', e.target.value)}
                                        placeholder="0123456789"
                                        maxLength={10}
                                    />
                                    {errors.account_number && <p className="text-sm text-destructive">{errors.account_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="account_type">Account Type</Label>
                                    <Select value={form.account_type} onValueChange={(v) => update('account_type', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="current">Current</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.account_type && <p className="text-sm text-destructive">{errors.account_type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="currency">Currency</Label>
                                    <Select value={form.currency} onValueChange={(v) => update('currency', v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN - Nigerian Naira</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Opening Balance</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={form.opening_balance}
                                        onChange={(e) => update('opening_balance', e.target.value)}
                                    />
                                    {errors.opening_balance && <p className="text-sm text-destructive">{errors.opening_balance}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Opening Balance Date</Label>
                                    <DatePickerSimple
                                        value={form.opening_balance_date}
                                        onChange={(date) => update('opening_balance_date', date)}
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-6">
                                    <Switch
                                        id="is_active"
                                        checked={form.is_active}
                                        onCheckedChange={(v) => update('is_active', v)}
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={form.notes}
                                    onChange={(e) => update('notes', e.target.value)}
                                    placeholder="Optional notes about this account"
                                />
                            </div>

                            <div className="flex justify-end gap-4 pt-4">
                                <Link href={route('client-bank-accounts.index')}>
                                    <Button type="button" variant="outline">Cancel</Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Account'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
