import { InputError } from '@/components/InputError';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn, formatAmount } from '@/lib/utils';
import { Customer, Policy, PolicyProduct } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import CompanySearchCombobox, { InsuranceCompany } from '@/components/insurance/CompanySearchCombobox';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

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

interface EditCreditNoteProps {
    note: {
        id: number;
        note_number: string;
        customer_id: number;
        policy_id?: number;
        debit_note_id?: number;
        policy_product?: PolicyProduct;
        amount: number;
        tax_rate?: number;
        tax_amount?: number;
        commission_rate?: number;
        commission_amount?: number;
        total_amount?: number;
        transaction_type?: string;
        policy_type?: string;
        class_of_business?: string;
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
    debit_notes: any[];
    customers: Customer[];
    policies?: Policy[];
    tenant_id?: number;
}

export default function EditCreditNote({ note, debit_notes = [], customers = [] }: EditCreditNoteProps) {
    const [openCombobox, setOpenCombobox] = useState(false);
    const [isLoadingDebitNotes, setIsLoadingDebitNotes] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [commissionAmountFocused, setCommissionAmountFocused] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        debit_note_id: note.debit_note_id?.toString() || '',
        customer_id: note.customer_id?.toString() || '',
        policy_id: note.policy_id?.toString() || '',
        amount: note.amount?.toString() || '',
        tax_rate: note.tax_rate?.toString() || '',
        tax_amount: note.tax_amount?.toString() || '0',
        commission_rate: note.commission_rate?.toString() || '',
        commission_amount: note.commission_amount?.toString() || '',
        total_amount: note.total_amount || 0,
        transaction_type: note.transaction_type || '',
        policy_type: note.policy_type || '',
        class_of_business: note.class_of_business || '',
        description: note.description || '',
        internal_notes: note.internal_notes || '',
        issue_date: note.issue_date ? dayjs(note.issue_date).toDate() : (undefined as Date | undefined),
        due_date: note.due_date ? dayjs(note.due_date).toDate() : (undefined as Date | undefined),
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

    useEffect(() => {
        if (!data.description) {
            setData(
                'description',
                "Being the premium due on the policy. The net will be remitted to you within 30 days in compliance with the 'No Premium No Cover' policy of NAICOM ",
            );
        }
    }, []);

    // Populate data when debit note changes
    useEffect(() => {
        if (data.debit_note_id && data.debit_note_id !== note.debit_note_id?.toString()) {
            const dn = debit_notes.find((d) => d.id.toString() === data.debit_note_id);
            if (dn) {
                const pType = dn.policy_type || dn.policy?.policy_type?.name || dn.policy?.policy_product?.name || '';
                const cBusiness = dn.class_of_business || dn.policy?.policy_class?.name || '';
                setData((prev) => ({
                    ...prev,
                    customer_id: dn.customer_id?.toString() || '',
                    policy_id: dn.policy_id?.toString() || '',
                    amount: dn.amount?.toString() || '0', // Original premium amount (base for calculations)
                    tax_rate: dn.tax_rate?.toString() || '0',
                    tax_amount: dn.tax_amount?.toString() || '0',
                    currency_code: dn.currency_code || 'NGN',
                    exchange_rate: dn.exchange_rate || 1,
                    policy_type: pType || prev.policy_type,
                    class_of_business: cBusiness || prev.class_of_business,
                    insurer_id: dn.insurer_id?.toString() || '',
                    insurer_name: dn.insurer_name || '',
                    insurer_email: dn.insurer_email || '',
                    insurer_phone: dn.insurer_phone || '',
                    insurer_address: dn.insurer_address || '',
                    insurer_source: dn.insurer_source || '',
                    transaction_type: dn.transaction_type || '',
                    description: `Credit Note for Debit Note ${dn.note_number?.startsWith('DN-') ? dn.note_number : 'DN-' + dn.note_number}`,
                }));
            }
        }
    }, [data.debit_note_id]);

    // Auto-calculate tax amount from tax rate and original amount
    useEffect(() => {
        const taxRate = parseFloat(data.tax_rate) || 0;
        const base = parseFloat(data.amount) || 0;
        const calculatedTax = parseFloat(((base * taxRate) / 100).toFixed(2));
        setData('tax_amount', calculatedTax.toString());
    }, [data.amount, data.tax_rate]);

    // Auto-calculate commission amount from commission rate and base amount
    useEffect(() => {
        const commissionRate = parseFloat(data.commission_rate) || 0;
        if (commissionRate > 0 && data.commission_rate !== '') {
            const base = parseFloat(data.amount) || 0;
            const calculatedCommission = parseFloat(((base * commissionRate) / 100).toFixed(2));
            setData('commission_amount', calculatedCommission.toString());
        }
    }, [data.amount, data.commission_rate]);

    // Auto-calculate total = original_amount + tax_amount - commission_amount
    useEffect(() => {
        const base = parseFloat(data.amount) || 0;
        const tax = parseFloat(data.tax_amount) || 0;
        const comm = parseFloat(data.commission_amount) || 0;
        setData('total_amount', base + tax - comm);
    }, [data.amount, data.commission_amount, data.tax_amount]);

    const filteredDebitNotes = debit_notes.filter((dn) => {
        const matchesCustomer = !data.customer_id || dn.customer_id?.toString() === data.customer_id.toString();
        if (!matchesCustomer) return false;
        if (!searchQuery.trim()) return true;

        const dnNum = dn.note_number?.startsWith('DN-') ? dn.note_number : `DN-${dn.note_number}`;
        const custName = `${dn.customer?.first_name || ''} ${dn.customer?.last_name || dn.customer?.company_name || ''}`;
        const searchString = `${dnNum} ${custName} ${dn.total_amount}`.toLowerCase();
        return searchString.includes(searchQuery.toLowerCase().trim());
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('credit-notes.update', note.id), {
            onSuccess: () => {
                toast.success('Credit note updated successfully');
            },
            onError: (errs) => {
                toast.error('Failed to update credit note');
                console.log(errs);
            },
        });
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    const clearDate = (field: 'issue_date' | 'due_date') => {
        setData(field, undefined);
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

                                {/* Note Number + Transaction Type */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="note_number">Credit Note Number</Label>
                                        <Input id="note_number" name="note_number" value={data.note_number} readOnly className="bg-muted" />
                                        <InputError message={errors.note_number} />
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

                                {/* Customer Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer</Label>
                                    <Select
                                        name="customer_id"
                                        value={data.customer_id}
                                        onValueChange={(value) => {
                                            setIsLoadingDebitNotes(true);
                                            setData((prev) => ({
                                                ...prev,
                                                customer_id: value,
                                                debit_note_id: '',
                                            }));
                                            setSelectedDebitNoteData(null);
                                            setTimeout(() => setIsLoadingDebitNotes(false), 250);
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>
                                                    {getCustomerName(c)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.customer_id} />
                                </div>

                                {/* Debit Note Selection */}
                                <div className="space-y-2 flex flex-col">
                                    <Label htmlFor="debit_note_id">Debit Note</Label>
                                    <Popover open={openCombobox} onOpenChange={(open) => data.customer_id && !isLoadingDebitNotes ? setOpenCombobox(open) : setOpenCombobox(false)}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                disabled={!data.customer_id || isLoadingDebitNotes}
                                                className={cn("justify-between w-full font-normal", (!data.debit_note_id || !data.customer_id) && "text-muted-foreground")}
                                            >
                                                {isLoadingDebitNotes ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                        Loading debit notes...
                                                    </span>
                                                ) : !data.customer_id ? (
                                                    'Select a customer first'
                                                ) : data.debit_note_id ? (
                                                    (() => {
                                                          const dn = debit_notes.find((d) => d.id.toString() === data.debit_note_id);
                                                          if (!dn) return 'Select a debit note';
                                                          const dnNum = dn.note_number?.startsWith('DN-') ? dn.note_number : `DN-${dn.note_number}`;
                                                          return `${dnNum} - ${dn.customer?.first_name || ''} ${dn.customer?.last_name || dn.customer?.company_name || ''} (₦${formatAmount(dn.total_amount)})`;
                                                      })()
                                                ) : (
                                                    'Select a debit note'
                                                )}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-full">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search debit note..."
                                                    value={searchQuery}
                                                    onValueChange={setSearchQuery}
                                                />
                                                <CommandList>
                                                    {filteredDebitNotes.length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">
                                                            No debit note found.
                                                        </div>
                                                    ) : (
                                                        <CommandGroup>
                                                            {filteredDebitNotes.map((dn) => {
                                                                const dnNum = dn.note_number?.startsWith('DN-') ? dn.note_number : `DN-${dn.note_number}`;
                                                                const label = `${dnNum} - ${dn.customer?.first_name || ''} ${dn.customer?.last_name || dn.customer?.company_name || ''}`;
                                                                const isSelected = data.debit_note_id === dn.id.toString();
                                                                return (
                                                                    <div
                                                                        key={dn.id}
                                                                        role="option"
                                                                        aria-selected={isSelected}
                                                                        className={cn(
                                                                            "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                                                            isSelected && "bg-accent text-accent-foreground"
                                                                        )}
                                                                        onClick={() => {
                                                                            setData('debit_note_id', dn.id.toString());
                                                                            setOpenCombobox(false);
                                                                            setSearchQuery('');
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4 shrink-0',
                                                                                isSelected ? 'opacity-100' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <span className="truncate">{label} (₦{formatAmount(dn.total_amount)})</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </CommandGroup>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <InputError message={errors.debit_note_id} />
                                </div>

                                {/* Customer + Policy */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer(Insured)</Label>
                                        <Select name="customer_id" value={data.customer_id} disabled>
                                            <SelectTrigger className="bg-muted">
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
                                        <Select name="policy_id" value={data.policy_id} disabled>
                                            <SelectTrigger className="bg-muted">
                                                <SelectValue placeholder="Select policy or leave as To Be Advised" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {policies.map((policy) => (
                                                    <SelectItem key={policy.id} value={policy.id.toString()}>
                                                        {policy.policy_number}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={errors.policy_id} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="policy_type">Policy Type</Label>
                                        <Input
                                            id="policy_type"
                                            name="policy_type"
                                            placeholder="e.g. Comprehensive Motor, Fire & Special Perils"
                                            value={data.policy_type}
                                            onChange={(e) => setData('policy_type', e.target.value)}
                                        />
                                        <InputError message={errors.policy_type} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="class_of_business">Class of Business</Label>
                                        <Input
                                            id="class_of_business"
                                            name="class_of_business"
                                            placeholder="e.g. Motor, Fire, General Accident, Marine"
                                            value={data.class_of_business}
                                            onChange={(e) => setData('class_of_business', e.target.value)}
                                        />
                                        <InputError message={errors.class_of_business} />
                                    </div>
                                </div>

                                {/* Insurer Selection */}
                                <div className="space-y-2">
                                    <Label>Insurance Company / Underwriter</Label>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        scope="tenant"
                                        value={data.insurer_name || ''}
                                        onSelect={(company: InsuranceCompany) => {
                                            const displayName = company.branch && company.company_name
                                                ? `${company.company_name} — ${company.branch.name}`
                                                : company.name;
                                            setData((prev) => ({
                                                ...prev,
                                                insurer_id: company.id?.toString() || '',
                                                insurer_name: displayName,
                                                insurer_email: company.email || '',
                                                insurer_phone: company.phone || '',
                                                insurer_address: [company.address, company.city, company.state].filter(Boolean).join(', ') || '',
                                                insurer_source: company.source || '',
                                            }));
                                        }}
                                        onClear={() => {
                                            setData((prev) => ({
                                                ...prev,
                                                insurer_id: '',
                                                insurer_name: '',
                                                insurer_email: '',
                                                insurer_phone: '',
                                                insurer_address: '',
                                                insurer_source: '',
                                            }));
                                        }}
                                        placeholder="Search for an underwriter..."
                                    />
                                    <InputError message={errors.insurer_name} />
                                </div>

                                {/* Currency + Exchange Rate (Read-only) */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency_code">Currency</Label>
                                        <Input id="currency_code" value={data.currency_code} readOnly className="bg-muted" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="exchange_rate">Exchange Rate</Label>
                                        <Input id="exchange_rate" type="number" value={data.exchange_rate} readOnly className="bg-muted" />
                                    </div>
                                </div>

                                {/* Amount Fields */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Base Amount (From DN)</Label>
                                        <Input id="amount" name="amount" type="text" value={formatAmount(data.amount)} readOnly className="bg-muted" />
                                        <InputError message={errors.amount} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            name="tax_rate"
                                            type="number"
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

                                {/* Commission Fields (Optional) */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="commission_rate">
                                            Commission Rate (%) <span className="text-xs text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="commission_rate"
                                            name="commission_rate"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            value={data.commission_rate}
                                            onChange={(e) => setData('commission_rate', e.target.value)}
                                            placeholder="e.g. 15"
                                        />
                                        <InputError message={errors.commission_rate} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="commission_amount">
                                            Commission Amount <span className="text-xs text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="commission_amount"
                                            name="commission_amount"
                                            type="text"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={commissionAmountFocused ? data.commission_amount : formatAmount(data.commission_amount)}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                                    setData('commission_amount', raw);
                                                }
                                            }}
                                            onFocus={() => setCommissionAmountFocused(true)}
                                            onBlur={() => setCommissionAmountFocused(false)}
                                            placeholder="Auto-calculated or enter manually"
                                        />
                                        <p className="text-xs text-muted-foreground">Auto-calculated from commission rate, or enter manually.</p>
                                        <InputError message={errors.commission_amount} />
                                    </div>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="issue_date">Issue Date</Label>
                                        <div className="flex gap-2">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={'outline'}
                                                        className={cn(
                                                            'flex-1 justify-start text-left font-normal',
                                                            !data.issue_date && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.issue_date ? dayjs(data.issue_date).format('MMMM D, YYYY') : <span>To be advised</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.issue_date}
                                                        onSelect={(date) => setData('issue_date', date ?? undefined)}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
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
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={'outline'}
                                                        className={cn(
                                                            'flex-1 justify-start text-left font-normal',
                                                            !data.due_date && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.due_date ? dayjs(data.due_date).format('MMMM D, YYYY') : <span>To be advised</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.due_date}
                                                        onSelect={(date) => setData('due_date', date ?? undefined)}
                                                    />
                                                </PopoverContent>
                                            </Popover>
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

                                {/* Description + Notes */}
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
