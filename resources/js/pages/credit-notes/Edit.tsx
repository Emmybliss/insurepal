import { InputError } from '@/components/InputError';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Customer, Policy, PolicyProduct } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import CompanySearchCombobox, { InsuranceCompany } from '@/components/insurance/CompanySearchCombobox';

interface EditCreditNoteProps {
    customers: Customer[];
    policies: Policy[];
    tenant_id?: number;
    note: {
        id: number;
        note_number: string;
        customer_id: number;
        policy_id?: number;
        policy_product?: PolicyProduct;
        amount: number;
        tax_amount?: number;
        total_amount?: number;
        description: string;
        internal_notes?: string;
        issue_date?: string;
        due_date?: string;
        currency_code?: string;
        exchange_rate?: number;
        payment_terms_days?: number;
        insurer_id?: number | null;
        insurer_name?: string | null;
        insurer_email?: string | null;
        insurer_phone?: string | null;
        insurer_address?: string | null;
        insurer_source?: string | null;
    };
}

export default function EditCreditNote({ customers, policies, note, tenant_id }: EditCreditNoteProps) {
    const { data, setData, put, processing, errors } = useForm({
        customer_id: note.customer_id?.toString() || '',
        policy_id: note.policy_id?.toString() || '',
        amount: note.amount?.toString() || '',
        tax_amount: note.tax_amount?.toString() || '0',
        total_amount: note.total_amount || 0,
        description: note.description || '',
        internal_notes: note.internal_notes || '',
        issue_date: note.issue_date ? dayjs(note.issue_date).toDate() : new Date(),
        due_date: note.due_date ? dayjs(note.due_date).toDate() : undefined,
        currency_code: note.currency_code || 'NGN',
        exchange_rate: note.exchange_rate || 1,
        payment_terms_days: note.payment_terms_days?.toString() || '',
        note_number: note.note_number,
        tenant_id: tenant_id,
        // Insurer fields
        insurer_id: (note as any).insurer_id?.toString() || '',
        insurer_name: (note as any).insurer_name || '',
        insurer_email: (note as any).insurer_email || '',
        insurer_phone: (note as any).insurer_phone || '',
        insurer_address: (note as any).insurer_address || '',
        insurer_source: (note as any).insurer_source || '',
    });
    const [isRateLoading, setIsRateLoading] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);
    const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>(policies);
    const [selectedInsurer, setSelectedInsurer] = useState<InsuranceCompany | null>(
        note.insurer_name ? { id: note.insurer_id || 0, name: note.insurer_name, source: note.insurer_source as any || 'registry' } : null
    );

    useEffect(() => {
        if (!data.description) {
            setData(
                'description',
                "Being the premium due on the policy. The net will be remitted to you within 30 days in compliance with the 'No Premium No Cover' policy of NAICOM ",
            );
        }
    }, []);

    useEffect(() => {
        const base = parseFloat(data.amount) || 0;
        const tax = parseFloat(data.tax_amount) || 0;
        setData('total_amount', base + tax);
    }, [data.amount, data.tax_amount]);

    useEffect(() => {
        let active = true;

        const fetchRate = async () => {
            if (data.currency_code === 'NGN') {
                setData('exchange_rate', 1);
                setRateError(null);
                return;
            }

            setIsRateLoading(true);
            setRateError(null);

            try {
                const res = await fetch(`/api/exchange-rate?from=${data.currency_code}&to=NGN`);
                if (!res.ok) throw new Error('Failed to fetch exchange rate');

                const rateData = await res.json();
                if (active && rateData.rate) setData('exchange_rate', rateData.rate);
            } catch (err) {
                if (active) {
                    setRateError('Unable to fetch exchange rate');
                    console.error(err);
                }
            } finally {
                if (active) setIsRateLoading(false);
            }
        };

        fetchRate();
        return () => {
            active = false;
        };
    }, [data.currency_code]);

    useEffect(() => {
        if (data.customer_id) {
            setFilteredPolicies(policies.filter((policy) => policy.customer_id.toString() === data.customer_id.toString()));
        } else {
            setFilteredPolicies(policies);
        }
    }, [data.customer_id, policies]);

    const handlePolicyChange = (policyId: string) => {
        const policy = policies.find((p) => p.id.toString() === policyId);
        setData('policy_id', policyId);
        if (policy) {
            setData('amount', policy.premium_amount.toString());
            setData(
                'description',
                `Being Premium Due on the Policy ${policy.policy_product.name}(${policy.policy_number}) Scheme for ${
                    policy.effective_date ? dayjs(policy.effective_date).format('DD-MM-YYYY') : 'N/A'
                } to ${policy.expiry_date ? dayjs(policy.expiry_date).format('DD-MM-YYYY') : 'N/A'}. `,
            );
        } else {
            setData('amount', '');
            setData('description', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('credit-notes.update', note.id));
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    return (
        <AppLayout>
            <Head title={`Edit Credit Note - ${note.id}`} />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Edit Credit Note</h2>
                    <p className="text-muted-foreground">Edit credit note details</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Edit Credit Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-6">
                                <input type="hidden" name="tenant_id" value={data.tenant_id} />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="note_number">Credit Note Number</Label>
                                        <Input id="note_number" name="note_number" value={data.note_number} readOnly />
                                        <InputError message={errors.note_number} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer(Insured)</Label>
                                        <Select name="customer_id" value={data.customer_id} disabled>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {customers.map((customer) => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {getCustomerName(customer)}
                                                        {customer.email ? ` - ${customer.email}` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.customer_id} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="policy_id">Policy / Risk Reference</Label>
                                        <Select
                                            name="policy_id"
                                            value={data.policy_id}
                                            onValueChange={handlePolicyChange}
                                            disabled={!data.customer_id}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select policy or leave as To Be Advised" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {filteredPolicies.map((policy) => (
                                                    <SelectItem key={policy.id} value={policy.id.toString()}>
                                                        {policy.policy_number}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank if the policy is not available yet. It will be marked as To Be Advised and can be updated later.
                                        </p>
                                        <InputError message={errors.policy_id} />
                                    </div>
                                </div>

                                {/* Insurer Selection */}
                                <div className="rounded-lg border bg-muted/20 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <Label className="text-base font-semibold">Insurer (Underwriter)</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Select the insurer for this credit note.
                                            </p>
                                        </div>
                                    </div>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        value={data.insurer_name}
                                        scope="tenant"
                                        onSelect={(company) => {
                                            setSelectedInsurer(company);
                                            setData({
                                                ...data,
                                                insurer_id: String(company.company_id || company.id),
                                                insurer_name: company.name,
                                                insurer_email: company.email || '',
                                                insurer_phone: company.phone || '',
                                                insurer_address: company.address || '',
                                                insurer_source: company.source,
                                            });
                                        }}
                                        onClear={() => {
                                            setSelectedInsurer(null);
                                            setData({
                                                ...data,
                                                insurer_id: '',
                                                insurer_name: '',
                                                insurer_email: '',
                                                insurer_phone: '',
                                                insurer_address: '',
                                                insurer_source: '',
                                            });
                                        }}
                                        placeholder="Search for an underwriter..."
                                    />
                                    {errors.insurer_id && <p className="mt-2 text-sm text-red-500">{errors.insurer_id}</p>}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency_code">Currency</Label>
                                        <Select
                                            name="currency_code"
                                            value={data.currency_code}
                                            onValueChange={(value) => setData('currency_code', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">NGN</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.currency_code} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="exchange_rate">Exchange Rate</Label>
                                        <div className="relative">
                                            <Input
                                                id="exchange_rate"
                                                name="exchange_rate"
                                                type="number"
                                                step="0.000001"
                                                value={data.exchange_rate}
                                                onChange={(e) => setData('exchange_rate', parseFloat(e.target.value))}
                                                required
                                            />
                                            {isRateLoading && (
                                                <span className="absolute top-2 right-2 text-xs text-muted-foreground">Fetching...</span>
                                            )}
                                            {rateError && <p className="text-xs text-red-500">{rateError}</p>}
                                        </div>
                                        <InputError message={errors.exchange_rate} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Base Amount</Label>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="number"
                                            step="0.01"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_amount">Tax Amount</Label>
                                        <Input
                                            id="tax_amount"
                                            name="tax_amount"
                                            type="number"
                                            step="0.01"
                                            value={data.tax_amount}
                                            onChange={(e) => setData('tax_amount', e.target.value)}
                                        />
                                        <InputError message={errors.tax_amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="total_amount">Total Amount in {data.currency_code}</Label>
                                        <Input
                                            id="total_amount"
                                            name="total_amount"
                                            type="number"
                                            step="0.01"
                                            value={
                                                data.currency_code === 'NGN'
                                                    ? data.total_amount
                                                    : parseFloat((data.total_amount * data.exchange_rate).toFixed(2))
                                            }
                                            readOnly
                                            required
                                        />
                                        {data.currency_code !== 'NGN' && (
                                            <p className="text-sm text-muted-foreground">
                                                ≈{' '}
                                                {(data.total_amount * data.exchange_rate).toLocaleString('en-NG', {
                                                    style: 'currency',
                                                    currency: 'NGN',
                                                })}
                                            </p>
                                        )}
                                        <InputError message={errors.total_amount} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="issue_date">Issue Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !data.issue_date && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {data.issue_date ? dayjs(data.issue_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={data.issue_date}
                                                    onSelect={(date) => date && setData('issue_date', date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.issue_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={'outline'}
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !data.due_date && 'text-muted-foreground',
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {data.due_date ? dayjs(data.due_date).format('MMMM D, YYYY') : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar mode="single" selected={data.due_date} onSelect={(date) => setData('due_date', date)} />
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.due_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment_terms_days">Payment Terms (Days)</Label>
                                        <Input
                                            id="payment_terms_days"
                                            name="payment_terms_days"
                                            type="number"
                                            value={data.payment_terms_days}
                                            onChange={(e) => setData('payment_terms_days', e.target.value)}
                                            placeholder="Optional"
                                        />
                                        <InputError message={errors.payment_terms_days} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            name="description"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            required
                                            rows={4}
                                        />
                                        <InputError message={errors.description} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="internal_notes">Internal Notes</Label>
                                        <Textarea
                                            id="internal_notes"
                                            name="internal_notes"
                                            value={data.internal_notes}
                                            onChange={(e) => setData('internal_notes', e.target.value)}
                                            rows={3}
                                            placeholder="Optional notes (visible only to staff)"
                                        />
                                        <InputError message={errors.internal_notes} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update'} Credit Note
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
