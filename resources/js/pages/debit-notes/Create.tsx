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
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import { Customer, Policy } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface LastDebitNoteProp {
    note_number: string;
}
interface CreateDebitNoteProps {
    lastDebitNote?: LastDebitNoteProp;
    customers: Customer[];
    policies: Policy[];
    selectedCustomer?: number;
    tenant_id?: number;
}

export default function CreateDebitNote({ customers, policies, selectedCustomer, lastDebitNote, tenant_id }: CreateDebitNoteProps) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        tenant_id: tenant_id,
        customer_id: selectedCustomer?.toString() || '',
        policy_id: '',
        amount: '',
        tax_amount: '0',
        total_amount: 0,
        description: '',
        internal_notes: '',
        issue_date: new Date(),
        due_date: undefined as Date | undefined,
        currency_code: 'NGN',
        exchange_rate: 1,
        payment_terms_days: '',
        debit_note_number: lastDebitNote?.note_number ? String(Number(lastDebitNote.note_number) + 1).padStart(6, '0') : '000001',
    });
    console.log('lastDebitNote', lastDebitNote);
    const [isRateLoading, setIsRateLoading] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);
    const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>(policies ?? []);

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
            setFilteredPolicies([]);
        }
    }, [data.customer_id, policies]);

    const handlePolicyChange = (policyId: string) => {
        const policy = policies.find((p) => p.id.toString() === policyId);
        setData('policy_id', policyId);
        if (policy) {
            setData('amount', policy.premium_amount.toString());
            setData(
                'description',
                `Being Premium Due on the Policy ${policy.policy_product.name}(${policy.policy_number}) Scheme for ${policy.effective_date ? dayjs(policy.effective_date).format('DD-MM-YYYY') : 'N/A'
                } to ${policy.expiry_date ? dayjs(policy.expiry_date).format('DD-MM-YYYY') : 'N/A'}. `,
            );
        } else {
            setData('amount', '');
            setData('description', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('debit-notes.store'));
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomerList((prev) => [...prev, newCustomer]);
        const newId = newCustomer.id.toString();
        setData('customer_id', newId);
        router.get(route('debit-notes.create'), { customer_id: newId }, { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Create Debit Note" />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Debit Note</h2>
                    <p className="text-muted-foreground">Create a new debit note</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Debit Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-6">
                                <input type="hidden" name="tenant_id" value={data.tenant_id} />
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="note_number">Debit Note Number</Label>
                                        <Input id="note_number" name="note_number" value={data.debit_note_number} readOnly />
                                        <InputError message={errors.debit_note_number} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer(Insured)</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select
                                                    name="customer_id"
                                                    value={data.customer_id}
                                                    onValueChange={(value) => {
                                                        router.get(route('debit-notes.create'), { customer_id: value }, { preserveScroll: true });
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select a customer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {customerList.map((customer) => (
                                                            <SelectItem key={customer.id} value={customer.id.toString()}>
                                                                {getCustomerName(customer)}
                                                                {customer.email ? ` - ${customer.email}` : ''}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => setCustomerModalOpen(true)} className="shrink-0 self-start mt-0">
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add New
                                            </Button>
                                        </div>
                                        <InputError message={errors.customer_id} />
                                        <CustomerCreateModal
                                            open={customerModalOpen}
                                            onOpenChange={setCustomerModalOpen}
                                            onCustomerCreated={handleCustomerCreated}
                                        />
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
                                                {filteredPolicies.length === 0 ? (
                                                    <SelectItem value="none" disabled>
                                                        No policies available
                                                    </SelectItem>
                                                ) : (
                                                    filteredPolicies.map((policy) => (
                                                        <SelectItem key={policy.id} value={policy.id.toString()}>
                                                            {policy.policy_number}
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank if the policy is not available yet. It will be marked as To Be Advised and can be updated later.
                                        </p>
                                        <InputError message={errors.policy_id} />
                                    </div>
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
                                    {processing ? 'Creating...' : 'Create'} Debit Note
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
