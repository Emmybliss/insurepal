import { InputError } from '@/components/InputError';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Customer, Invoice, Policy, Receipt } from '@/types';
import { useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, FileText, Hash, ShieldCheck, User } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ReceiptFormProps {
    receipt?: Receipt;
    mode?: 'create' | 'edit';
    customers?: Customer[];
    policies?: Policy[];
    /** Auto-generated receipt number for new receipts  */
    nextReceiptNumber?: string;
    /** Optional invoice pre-linked (e.g. from invoice detail page) */
    invoice?: Invoice | null;
}

const fmt = (amount: number | string, currency = 'NGN') => new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(amount));

const getCustomerName = (c: Customer) => (c.type === 'individual' ? `${c.first_name} ${c.last_name}` : c.company_name);

export const ReceiptForm: React.FC<ReceiptFormProps> = ({ receipt, mode = 'create', customers = [], policies = [], nextReceiptNumber, invoice }) => {
    const [dateOpen, setDateOpen] = useState(false);
    const [dateObj, setDateObj] = useState<Date | undefined>(receipt?.payment_date ? new Date(receipt.payment_date) : new Date());

    // ── Form state ────────────────────────────────────────────────────────────
    const { data, setData, post, put, processing, errors, reset } = useForm({
        invoice_id: invoice?.id ? String(invoice.id) : receipt?.invoice_id ? String(receipt.invoice_id) : '',
        customer_id: receipt?.customer_id ? String(receipt.customer_id) : invoice?.customer_id ? String(invoice.customer_id) : '',
        policy_id: receipt?.policy_id ? String(receipt.policy_id) : invoice?.policy_id ? String(invoice.policy_id) : '',
        amount_paid: receipt?.amount_paid ? Number(receipt.amount_paid) : 0,
        payment_date: receipt?.payment_date ?? dayjs().format('YYYY-MM-DD'),
        payment_method: receipt?.payment_method ?? 'bank_transfer',
        transaction_id: receipt?.transaction_id ?? '',
        currency: receipt?.currency ?? invoice?.currency ?? 'NGN',
        notes: receipt?.notes ?? '',
    });

    // ── When policy changes → auto-fill amount & customer ────────────────────
    const handlePolicyChange = (policyId: string) => {
        setData('policy_id', policyId);
        if (policyId && policyId !== 'none') {
            const policy = policies.find((p) => p.id.toString() === policyId);
            if (policy) {
                setData('amount_paid', policy.premium_amount ?? 0);
                // auto-fill customer if not already set
                if (!data.customer_id && policy.customer_id) {
                    setData('customer_id', String(policy.customer_id));
                }
                if (policy.currency) {
                    setData('currency', policy.currency);
                }
            }
        }
    };

    useEffect(() => {
        if (data.payment_date) {
            const parsed = dayjs(data.payment_date);
            if (parsed.isValid()) setDateObj(parsed.toDate());
        }
    }, [data.payment_date]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'edit' && receipt) {
            put(route('receipts.update', receipt.id), {
                onSuccess: () => toast.success('Receipt updated successfully'),
                onError: () => toast.error('Failed to update receipt'),
            });
        } else {
            post(route('receipts.store'), {
                onSuccess: () => {
                    toast.success('Receipt created successfully');
                    reset();
                },
                onError: () => toast.error('Failed to create receipt'),
            });
        }
    };

    // ── Lookups ───────────────────────────────────────────────────────────────
    const selectedPolicy = policies.find((p) => p.id.toString() === data.policy_id);
    const selectedCustomer = customers.find((c) => c.id.toString() === data.customer_id);

    const paymentMethods = [
        { value: 'cash', label: 'Cash' },
        { value: 'bank_transfer', label: 'Bank Transfer' },
        { value: 'cheque', label: 'Cheque' },
        { value: 'credit_card', label: 'Credit Card' },
        { value: 'debit_card', label: 'Debit Card' },
        { value: 'mobile_money', label: 'Mobile Money' },
        { value: 'online_portal', label: 'Online Portal' },
        { value: 'direct_debit', label: 'Direct Debit' },
    ];

    const currencies = ['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR'];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Receipt Reference ────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Hash className="h-4 w-4 text-primary" />
                        Receipt Reference
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Receipt Number</Label>
                            <Input
                                value={mode === 'edit' ? (receipt?.receipt_number ?? '') : (nextReceiptNumber ?? 'Auto-generated')}
                                readOnly
                                className="bg-muted font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">
                                {mode === 'create' ? 'Auto-assigned on save' : 'Receipt number cannot be changed'}
                            </p>
                        </div>

                        {/* Linked Invoice (optional) */}
                        <div className="space-y-2">
                            <Label>Linked Invoice (Optional)</Label>
                            <Input
                                value={invoice?.invoice_number ?? receipt?.invoice?.invoice_number ?? '— None —'}
                                readOnly
                                className="bg-muted font-mono text-sm"
                            />
                            {invoice && <p className="text-xs text-muted-foreground">Invoice Total: {fmt(invoice.total_amount, invoice.currency)}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Insured & Policy ─────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Insured &amp; Policy
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Policy first — drives amount & customer */}
                        <div className="space-y-2">
                            <Label htmlFor="policy_id">Policy</Label>
                            <Select value={data.policy_id} onValueChange={handlePolicyChange}>
                                <SelectTrigger id="policy_id">
                                    <SelectValue placeholder="Select policy" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">— None —</SelectItem>
                                    {policies.map((p) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.policy_number}
                                            {p.policy_product?.name ? ` — ${p.policy_product.name}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.policy_id} />
                        </div>

                        {/* Customer (Insured) */}
                        <div className="space-y-2">
                            <Label htmlFor="customer_id">Insured (Customer)</Label>
                            <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                <SelectTrigger id="customer_id">
                                    <SelectValue placeholder="Select insured" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {getCustomerName(c)}
                                            {c.email ? ` — ${c.email}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.customer_id} />
                        </div>
                    </div>

                    {/* Policy detail panel */}
                    {selectedPolicy && (
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <div className="mb-2 flex items-center gap-2 font-semibold">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                Policy Details
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
                                <div>
                                    <span className="text-muted-foreground">Policy No: </span>
                                    <span className="font-mono font-medium">{selectedPolicy.policy_number}</span>
                                </div>
                                {selectedPolicy.policy_product?.name && (
                                    <div>
                                        <span className="text-muted-foreground">Product: </span>
                                        {selectedPolicy.policy_product.name}
                                    </div>
                                )}
                                {selectedPolicy.effective_date && (
                                    <div>
                                        <span className="text-muted-foreground">Cover: </span>
                                        {dayjs(selectedPolicy.effective_date).format('DD/MM/YYYY')} &mdash;{' '}
                                        {dayjs(selectedPolicy.expiry_date).format('DD/MM/YYYY')}
                                    </div>
                                )}
                                {selectedPolicy.premium_amount != null && (
                                    <div>
                                        <span className="text-muted-foreground">Premium: </span>
                                        <span className="font-semibold text-primary">
                                            {fmt(selectedPolicy.premium_amount, selectedPolicy.currency)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Status: </span>
                                    <Badge variant={selectedPolicy.is_active ? 'default' : 'secondary'} className="text-xs">
                                        {selectedPolicy.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Customer detail panel */}
                    {selectedCustomer && (
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                            <div className="mb-2 flex items-center gap-2 font-semibold">
                                <User className="h-4 w-4 text-primary" />
                                Insured Details
                            </div>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 md:grid-cols-3">
                                <div>
                                    <span className="text-muted-foreground">Name: </span>
                                    {getCustomerName(selectedCustomer)}
                                </div>
                                {selectedCustomer.email && (
                                    <div>
                                        <span className="text-muted-foreground">Email: </span>
                                        {selectedCustomer.email}
                                    </div>
                                )}
                                {selectedCustomer.phone && (
                                    <div>
                                        <span className="text-muted-foreground">Phone: </span>
                                        {selectedCustomer.phone}
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted-foreground">Type: </span>
                                    <Badge variant="outline" className="text-xs capitalize">
                                        {selectedCustomer.type}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Payment Details ───────────────────────────────────────── */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4 text-primary" />
                        Payment Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Amount Paid */}
                        <div className="space-y-2">
                            <Label htmlFor="amount_paid">Amount Paid</Label>
                            <div className="relative">
                                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">{data.currency}</span>
                                <Input
                                    id="amount_paid"
                                    type="number"
                                    step="0.01"
                                    min={0}
                                    className="pl-14"
                                    value={data.amount_paid}
                                    onChange={(e) => setData('amount_paid', parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            {selectedPolicy?.premium_amount != null && (
                                <p className="text-xs text-muted-foreground">
                                    Policy premium: {fmt(selectedPolicy.premium_amount, selectedPolicy.currency)}
                                </p>
                            )}
                            <InputError message={errors.amount_paid} />
                        </div>

                        {/* Currency */}
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={data.currency} onValueChange={(v) => setData('currency', v)}>
                                <SelectTrigger id="currency">
                                    <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                                <SelectContent>
                                    {currencies.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {c}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.currency} />
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_date">Payment Date</Label>
                            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal', !data.payment_date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {data.payment_date ? dayjs(data.payment_date).format('DD MMMM YYYY') : 'Pick a date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={dateObj}
                                        onSelect={(date) => {
                                            if (date) {
                                                setDateObj(date);
                                                setData('payment_date', dayjs(date).format('YYYY-MM-DD'));
                                            }
                                            setDateOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <InputError message={errors.payment_date} />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                <SelectTrigger id="payment_method">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <InputError message={errors.payment_method} />
                        </div>

                        {/* Transaction / Ref ID */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="transaction_id">Transaction / Reference No.</Label>
                            <Input
                                id="transaction_id"
                                className="font-mono"
                                value={data.transaction_id}
                                onChange={(e) => setData('transaction_id', e.target.value)}
                                placeholder="e.g. TRF-2024-123456 / Cheque No. / POS Ref"
                            />
                            <InputError message={errors.transaction_id} />
                        </div>

                        {/* Notes / Narration */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notes">Notes / Narration</Label>
                            <Textarea
                                id="notes"
                                rows={3}
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="e.g. Being premium payment for Motor Policy — {policy_number} covering {period}"
                            />
                            <InputError message={errors.notes} />
                        </div>
                    </div>

                    {/* Summary strip */}
                    <Separator />
                    <div className="flex items-center justify-between text-sm">
                        <div className="space-y-0.5">
                            <p className="text-muted-foreground">Amount to Record</p>
                            <p className="text-xl font-bold">{fmt(Number(data.amount_paid) || 0, data.currency)}</p>
                        </div>
                        <Button type="submit" disabled={processing} size="lg">
                            {mode === 'edit' ? 'Update Receipt' : 'Record Payment'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
};
