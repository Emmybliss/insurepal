import { InputError } from '@/components/InputError';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn, formatAmount } from '@/lib/utils';
import { Customer } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import CustomerSearchSelect from '@/components/customers/CustomerSearchSelect';
import PolicyNumberSearchSelect from '@/components/policies/PolicyNumberSearchSelect';
import CompanySearchCombobox, { InsuranceCompany } from '@/components/insurance/CompanySearchCombobox';
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

export interface LastCreditNoteProp {
    note_number: string;
}

interface CreateCreditNoteProps {
    lastCreditNote?: LastCreditNoteProp | string;
    debit_notes: any[];
    customers: Customer[];
    selectedDebitNote?: number | string;
    selectedCustomer?: number | string;
    tenant_id?: number;
}

export default function CreateCreditNote({ debit_notes = [], customers = [], selectedDebitNote, selectedCustomer, lastCreditNote, tenant_id }: CreateCreditNoteProps) {
    const { data, setData, post, processing, errors } = useForm({
        debit_note_id: selectedDebitNote?.toString() || '',
        customer_id: selectedCustomer?.toString() || '',
        policy_id: '',
        amount: '',
        tax_rate: '',
        tax_amount: '0',
        commission_rate: '',
        commission_amount: '',
        total_amount: 0,
        transaction_type: '',
        description: "Being the premium due on the policy. The net will be remitted to you within 30 days in compliance with the 'No Premium No Cover' policy of NAICOM",
        internal_notes: '',
        issue_date: undefined as Date | undefined,
        due_date: undefined as Date | undefined,
        currency_code: 'NGN',
        exchange_rate: 1,
        payment_terms_days: '',
        note_number: typeof lastCreditNote === 'string' ? lastCreditNote : (lastCreditNote?.note_number ?? 'CN-AUTO'),
        tenant_id: tenant_id,
        policy_type: '',
        class_of_business: '',
        // Insurer fields
        insurer_id: '',
        insurer_name: '',
        insurer_email: '',
        insurer_phone: '',
        insurer_address: '',
        insurer_source: '',
    });

    const [selectedDebitNoteData, setSelectedDebitNoteData] = useState<any>(null);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [isLoadingDebitNotes, setIsLoadingDebitNotes] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [commissionAmountFocused, setCommissionAmountFocused] = useState(false);
    console.log(debit_notes);
    // Populate data when debit note changes
    useEffect(() => {
        if (data.debit_note_id) {
            const dn = debit_notes.find((d) => d.id.toString() === data.debit_note_id);
            setSelectedDebitNoteData(dn || null);
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
                    description: prev.description || `Credit Note for Debit Note ${dn.note_number?.startsWith('DN-') ? dn.note_number : 'DN-' + dn.note_number}`,
                }));
            }
        } else {
            setSelectedDebitNoteData(null);
        }
    }, [data.debit_note_id, debit_notes]);

    // Auto-calculate tax amount from tax rate and base amount
    useEffect(() => {
        const base = parseFloat(data.amount) || 0;
        const taxRate = parseFloat(data.tax_rate) || 0;
        const calculatedTax = parseFloat(((base * taxRate) / 100).toFixed(2));
        setData('tax_amount', calculatedTax.toString());
    }, [data.amount, data.tax_rate]);

    const filteredDebitNotes = debit_notes.filter((dn) => {
        const matchesCustomer = !data.customer_id || dn.customer_id?.toString() === data.customer_id.toString();
        if (!matchesCustomer) return false;
        if (!searchQuery.trim()) return true;

        const dnNum = dn.note_number?.startsWith('DN-') ? dn.note_number : `DN-${dn.note_number}`;
        const custName = `${dn.customer?.first_name || ''} ${dn.customer?.last_name || dn.customer?.company_name || ''}`;
        const searchString = `${dnNum} ${custName} ${dn.total_amount}`.toLowerCase();
        return searchString.includes(searchQuery.toLowerCase().trim());
    });

    // Auto-calculate commission amount from commission rate and base amount
    useEffect(() => {
        const base = parseFloat(data.amount) || 0;
        const commissionRate = parseFloat(data.commission_rate) || 0;
        if (commissionRate > 0 && data.commission_rate !== '') {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('credit-notes.store'));
    };

    const getCustomerName = (customer: Customer) => {
        return customer.type === 'individual' ? `${customer.first_name} ${customer.last_name}` : customer.company_name;
    };

    const clearDate = (field: 'issue_date' | 'due_date') => {
        setData(field, undefined);
    };

    return (
        <AppLayout>
            <Head title="Create Credit Note" />

            <div className="flex-1 space-y-4 pt-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Create Credit Note</h2>
                    <p className="text-muted-foreground">Create a new credit note</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Create Credit Note</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <input type="hidden" name="tenant_id" value={data.tenant_id} />
                            <div className="space-y-6">
                                {/* Note Number + Transaction Type */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="note_number">Credit Note Number</Label>
                                        <Input id="note_number" name="note_number" value={data.note_number} readOnly className="bg-muted" />
                                        <p className="text-xs text-muted-foreground">Auto-generated upon creation.</p>
                                        <InputError message={errors.note_number} />
                                    </div>

                                    {/* Insurer Selection */}
                                    <div className="space-y-2">
                                        <Label>Underwriter</Label>
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
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    {/* Customer Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer</Label>
                                        <CustomerSearchSelect
                                            value={data.customer_id}
                                            initialCustomers={customers}
                                            onChange={(customerId) => {
                                                setIsLoadingDebitNotes(true);
                                                setData((prev) => ({
                                                    ...prev,
                                                    customer_id: customerId,
                                                    debit_note_id: '',
                                                    policy_id: '',
                                                    amount: '',
                                                    tax_rate: '',
                                                    tax_amount: '0',
                                                    total_amount: 0,
                                                }));
                                                setSelectedDebitNoteData(null);
                                                setTimeout(() => setIsLoadingDebitNotes(false), 250);
                                            }}
                                        />
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
                                </div>
                                {selectedDebitNoteData && (
                                    <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                                        <h4 className="text-sm font-semibold">Referenced Debit Note Summary</h4>
                                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                                            <div>
                                                <span className="block text-muted-foreground">Customer:</span>
                                                <span className="font-medium">
                                                    {selectedDebitNoteData.customer?.first_name}{' '}
                                                    {selectedDebitNoteData.customer?.last_name || selectedDebitNoteData.customer?.company_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Policy:</span>
                                                <span className="font-medium">{selectedDebitNoteData.policy?.policy_number || 'TBA'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Policy Class:</span>
                                                <span className="font-medium">{selectedDebitNoteData.class_of_business}</span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Transaction Type:</span>
                                                <span className="font-medium">{selectedDebitNoteData.transaction_type}</span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Original Amount:</span>
                                                <span className="font-medium">{formatAmount(selectedDebitNoteData.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Original Amount:</span>
                                                <span className="font-medium">{formatAmount(selectedDebitNoteData.amount)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-muted-foreground">Total with Tax:</span>
                                                <span className="font-medium">{formatAmount(selectedDebitNoteData.total_amount)}</span>
                                            </div>

                                        </div>
                                    </div>
                                )}


                                {/* Currency + Exchange Rate (Read Only) */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="currency_code">Currency</Label>
                                        <Input id="currency_code" value={data.currency_code} readOnly className="bg-muted" />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="exchange_rate">Exchange Rate</Label>
                                        <Input id="exchange_rate" type="number" value={data.exchange_rate} readOnly className="bg-muted" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Base Amount (From DN)</Label>
                                        <Input id="amount" name="amount" type="text" value={formatAmount(data.amount)} readOnly className="bg-muted" />
                                        <InputError message={errors.amount} />
                                    </div>
                                </div>

                                {/* Amount Fields */}
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">


                                    <div className="space-y-2">
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            name="tax_rate"
                                            type="number"
                                            step="any"
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
                                    {/* Commission Fields (Optional) */}

                                    <div className="space-y-2">
                                        <Label htmlFor="commission_rate">
                                            Commission Rate (%) <span className="text-xs text-muted-foreground">(Optional)</span>
                                        </Label>
                                        <Input
                                            id="commission_rate"
                                            name="commission_rate"
                                            type="number"
                                            step="any"
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
                                    {processing ? 'Creating...' : 'Create'} Credit Note
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
