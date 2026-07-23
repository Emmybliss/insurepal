import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import { InputError } from '@/components/InputError';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn, formatAmount } from '@/lib/utils';
import { Customer, Policy } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const TRANSACTION_TYPE_OPTIONS = [
    { value: 'new', label: 'New Business' },
    { value: 'renewal', label: 'Renewal' },
    { value: 'endorsement', label: 'Endorsement' },
    { value: 'additional_premium', label: 'Additional Premium' },
    { value: 'adjustment', label: 'Adjustment' },
    { value: 'reinstatement', label: 'Reinstatement' },
    { value: 'replacement', label: 'Replacement' },
    { value: 'extension', label: 'Extension' },
    { value: 'short_period', label: 'Short Period' },
];

export interface LastDebitNoteProp {
    note_number: string;
}

interface PolicyType {
    id: number;
    name: string;
}

interface PolicyClass {
    id: number;
    name: string;
    policy_type_id: number;
}

interface CreateDebitNoteProps {
    lastDebitNote?: LastDebitNoteProp | string;
    customers: Customer[];
    policies: Policy[];
    selectedCustomer?: number;
    tenant_id?: number;
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
}

export default function CreateDebitNote({ customers, policies, selectedCustomer, lastDebitNote, tenant_id, policyTypes, policyClasses }: CreateDebitNoteProps) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const { data, setData, post, processing, errors } = useForm({
        tenant_id: tenant_id,
        customer_id: selectedCustomer?.toString() || '',
        policy_id: '',
        amount: '',
        tax_rate: '',
        tax_amount: '0',
        total_amount: 0,
        transaction_type: '',
        internal_notes: '',
        settlement_condition: 'Settlement Should Follow Immediately Unless Otherwise Stated',
        issue_date: undefined as Date | undefined,
        due_date: undefined as Date | undefined,
        currency_code: 'NGN',
        exchange_rate: 1,
        payment_terms_days: '',
        debit_note_number: typeof lastDebitNote === 'string' ? lastDebitNote : (lastDebitNote?.note_number ?? 'DN-AUTO'),
        policy_type: '',
        class_of_business: '',
        description: '',
    });

    const [isRateLoading, setIsRateLoading] = useState(false);
    const [rateError, setRateError] = useState<string | null>(null);
    const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>(policies ?? []);
    const [amountFocused, setAmountFocused] = useState(false);

    // Auto-calculate tax amount from tax rate and base amount
    useEffect(() => {
        const base = parseFloat(data.amount) || 0;
        const taxRate = parseFloat(data.tax_rate) || 0;
        const calculatedTax = parseFloat(((base * taxRate) / 100).toFixed(2));
        setData('tax_amount', calculatedTax.toString());
    }, [data.amount, data.tax_rate]);

    // Auto-calculate total = base + tax
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

    const selectedPolicyType = policyTypes.find((t) => t.name === data.policy_type);
    const filteredClasses = selectedPolicyType
        ? policyClasses.filter((c) => c.policy_type_id === selectedPolicyType.id)
        : policyClasses;

    const handlePolicyChange = (policyId: string) => {
        const policy = policies.find((p) => p.id.toString() === policyId);
        if (policy) {
            const pType = (policy as any).policy_type?.name || policy.policy_product?.name || '';
            const cBusiness = (policy as any).policy_class?.name || '';
            setData((prev) => ({
                ...prev,
                policy_id: policyId,
                amount: policy.premium_amount ? policy.premium_amount.toString() : prev.amount,
                policy_type: pType || prev.policy_type,
                class_of_business: cBusiness || prev.class_of_business,
                description: `Being Premium Due on the Policy ${policy.policy_product?.name || ''}(${policy.policy_number}) Scheme for ${policy.effective_date ? dayjs(policy.effective_date).format('DD-MM-YYYY') : 'N/A'
                    } to ${policy.expiry_date ? dayjs(policy.expiry_date).format('DD-MM-YYYY') : 'N/A'}. `,
            }));
        } else {
            setData('policy_id', policyId);
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

    const clearDate = (field: 'issue_date' | 'due_date') => {
        setData(field, undefined);
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
                                        <Input id="note_number" name="note_number" value={data.debit_note_number} readOnly className="bg-muted" />
                                        <p className="text-xs text-muted-foreground">Auto-generated upon creation.</p>
                                        <InputError message={errors.debit_note_number} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="transaction_type">Transaction Type</Label>
                                        <Select
                                            name="transaction_type"
                                            value={data.transaction_type}
                                            onValueChange={(value) => setData('transaction_type', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select transaction type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TRANSACTION_TYPE_OPTIONS.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.transaction_type} />
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
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCustomerModalOpen(true)}
                                                className="mt-0 shrink-0 self-start"
                                            >
                                                <Plus className="mr-1 h-4 w-4" />
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
                                            Leave blank if the policy is not available yet. It will be marked as To Be Advised and can be updated
                                            later.
                                        </p>
                                        <InputError message={errors.policy_id} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="policy_type">Policy Type</Label>
                                        <Popover
                                            open={typeSearchOpen}
                                            onOpenChange={(open) => {
                                                setTypeSearchOpen(open);
                                                if (!open) setTypeSearchQuery('');
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={typeSearchOpen}
                                                    className="w-full justify-between"
                                                >
                                                    {data.policy_type || 'Select policy type...'}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Search types..."
                                                        value={typeSearchQuery}
                                                        onValueChange={setTypeSearchQuery}
                                                    />
                                                    <CommandList>
                                                        {policyTypes.filter((t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                                                            .length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">No type found.</div>
                                                        ) : (
                                                            <CommandGroup>
                                                                {policyTypes
                                                                    .filter((t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                                                                    .map((t) => (
                                                                        <div
                                                                            key={t.id}
                                                                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                            onClick={() => {
                                                                                setData('policy_type', t.name);
                                                                                setData('class_of_business', '');
                                                                                setTypeSearchOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    'h-4 w-4',
                                                                                    data.policy_type === t.name ? 'opacity-100' : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {t.name}
                                                                        </div>
                                                                    ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.policy_type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="class_of_business">Class of Business</Label>
                                        <Popover
                                            open={classSearchOpen}
                                            onOpenChange={(open) => {
                                                setClassSearchOpen(open);
                                                if (!open) setClassSearchQuery('');
                                            }}
                                        >
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={classSearchOpen}
                                                    className="w-full justify-between"
                                                    disabled={!data.policy_type}
                                                >
                                                    {data.class_of_business || (data.policy_type ? 'Select class...' : 'Select a type first')}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                <Command shouldFilter={false}>
                                                    <CommandInput
                                                        placeholder="Search classes..."
                                                        value={classSearchQuery}
                                                        onValueChange={setClassSearchQuery}
                                                    />
                                                    <CommandList>
                                                        {filteredClasses.filter((c) => !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase()))
                                                            .length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">No class found.</div>
                                                        ) : (
                                                            <CommandGroup>
                                                                {filteredClasses
                                                                    .filter((c) => !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase()))
                                                                    .map((c) => (
                                                                        <div
                                                                            key={c.id}
                                                                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                            onClick={() => {
                                                                                setData('class_of_business', c.name);
                                                                                setClassSearchOpen(false);
                                                                            }}
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    'h-4 w-4',
                                                                                    data.class_of_business === c.name ? 'opacity-100' : 'opacity-0',
                                                                                )}
                                                                            />
                                                                            {c.name}
                                                                        </div>
                                                                    ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                        <InputError message={errors.class_of_business} />
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

                                {/* Amount Fields */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Base Amount</Label>
                                        <Input
                                            id="amount"
                                            name="amount"
                                            type="text"
                                            inputMode="decimal"
                                            value={amountFocused ? data.amount : formatAmount(data.amount)}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                                    setData('amount', raw);
                                                }
                                            }}
                                            onFocus={() => setAmountFocused(true)}
                                            onBlur={() => setAmountFocused(false)}
                                            required
                                        />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            name="tax_rate"
                                            type="number"
                                            step="any"
                                            min="0"
                                            max="100"
                                            value={data.tax_rate}
                                            onChange={(e) => setData('tax_rate', e.target.value)}
                                            placeholder="e.g. 7.5"
                                        />
                                        <InputError message={errors.tax_rate} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_amount">Tax Amount</Label>
                                        <Input
                                            id="tax_amount"
                                            name="tax_amount"
                                            type="text"
                                            value={formatAmount(data.tax_amount)}
                                            readOnly
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">Auto-calculated from tax rate.</p>
                                        <InputError message={errors.tax_amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="total_amount">Total Amount in {data.currency_code}</Label>
                                        <Input
                                            id="total_amount"
                                            name="total_amount"
                                            type="text"
                                            value={
                                                data.currency_code === 'NGN'
                                                    ? formatAmount(data.total_amount)
                                                    : formatAmount(parseFloat((data.total_amount * data.exchange_rate).toFixed(2)))
                                            }
                                            readOnly
                                            required
                                            className="bg-muted"
                                        />
                                        {data.currency_code !== 'NGN' && (
                                            <p className="text-sm text-muted-foreground">
                                                ≈ ₦{formatAmount(data.total_amount * data.exchange_rate)}
                                            </p>
                                        )}
                                        <InputError message={errors.total_amount} />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="issue_date">Issue Date</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <DatePickerSimple
                                                    date={data.issue_date}
                                                    onSelect={(date) => setData('issue_date', date ?? undefined)}
                                                    placeholder="To be advised"
                                                />
                                            </div>
                                            {data.issue_date && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => clearDate('issue_date')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Leave blank to mark as "To be advised".</p>
                                        <InputError message={errors.issue_date} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="due_date">Due Date</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <DatePickerSimple
                                                    date={data.due_date}
                                                    onSelect={(date) => setData('due_date', date ?? undefined)}
                                                    placeholder="To be advised"
                                                />
                                            </div>
                                            {data.due_date && (
                                                <Button type="button" variant="ghost" size="icon" onClick={() => clearDate('due_date')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Leave blank to mark as "To be advised".</p>
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

                                    <div className="space-y-2">
                                        <Label htmlFor="settlement_condition">Settlement Condition</Label>
                                        <Textarea
                                            id="settlement_condition"
                                            name="settlement_condition"
                                            value={data.settlement_condition}
                                            onChange={(e) => setData('settlement_condition', e.target.value)}
                                            rows={2}
                                        />
                                        <InputError message={errors.settlement_condition} />
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
