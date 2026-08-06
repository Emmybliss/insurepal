import RiskScheduleItem from '@/components/broker-slips/RiskScheduleItem';
import FinancialSummary from '@/components/broker-slips/FinancialSummary';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import CustomerSearchSelect from '@/components/customers/CustomerSearchSelect';
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
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Check, ChevronsUpDown, PlusCircle, Save, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type RiskMode = 'single' | 'scheduled' | 'mixed';

interface Customer {
    id: number;
    type: string;
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
}

interface PolicyType {
    id: number;
    name: string;
}

interface PolicyClass {
    id: number;
    name: string;
    risk_mode?: string;
    policy_type_id?: number;
}

interface PolicyProduct {
    id: number;
    name: string;
    coverage_label?: string;
    policy_class?: PolicyClass;
    base_premium?: string | number;
    default_rate_basis?: string;
}

interface QuoteRisk {
    policy_class_id: string;
    policy_product_id: string;
    description: string;
    coverage_amount: string;
    rate: string;
    rate_basis: string;
    premium: string;
    dynamic_fields: Record<string, any>;
}

interface QuoteClause {
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
}

interface FormData {
    customer_id: string;
    currency: string;
    period_start: string;
    period_end: string;
    valid_until: string;
    claim_payment_condition: string;
    commission_rate: string;
    fees: string;
    tax_rate: string;
    discount: string;
    policy_class_id: string;
    insurance_product_id: string;
    notes: string;
    risks: QuoteRisk[];
    clauses: QuoteClause[];
}

interface Props {
    customers: Customer[];
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
    policyProducts: PolicyProduct[];
    selectedCustomer?: Customer;
    defaultValidUntil?: string;
}

function createEmptyRisk(classId: string, productId: string, product?: PolicyProduct): QuoteRisk {
    return {
        policy_class_id: classId,
        policy_product_id: productId,
        description: '',
        coverage_amount: '',
        rate: product?.base_premium?.toString() || '',
        rate_basis: product?.default_rate_basis || 'percentage',
        premium: '',
        dynamic_fields: {},
    };
}

export default function Create({ customers, policyTypes, policyClasses, policyProducts, selectedCustomer, defaultValidUntil }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers || []);
    const [selectedTypeId, setSelectedTypeId] = useState<string>('');
    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');

    const { data, setData, post, processing, errors } = useForm<FormData>({
        customer_id: selectedCustomer?.id?.toString() || '',
        currency: 'NGN',
        period_start: dayjs().format('YYYY-MM-DD'),
        period_end: dayjs().add(1, 'year').format('YYYY-MM-DD'),
        valid_until: defaultValidUntil || dayjs().add(30, 'day').format('YYYY-MM-DD'),
        claim_payment_condition: '',
        commission_rate: '',
        fees: '',
        tax_rate: '',
        discount: '',
        policy_class_id: '',
        insurance_product_id: '',
        notes: '',
        risks: [] as QuoteRisk[],
        clauses: [] as QuoteClause[],
    });

    const selectedClass = policyClasses.find((c) => c.id.toString() === selectedClassId);
    const riskMode: RiskMode = (selectedClass?.risk_mode as RiskMode) || 'single';

    const filteredClasses = policyClasses.filter((c) => {
        if (c.policy_type_id?.toString() !== selectedTypeId) return false;
        return !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase());
    });

    const handleCustomerCreated = (newCustomer: import('@/types').Customer) => {
        const adapted: Customer = {
            id: newCustomer.id,
            type: newCustomer.type,
            first_name: newCustomer.first_name,
            last_name: newCustomer.last_name,
            company_name: newCustomer.company_name,
            email: newCustomer.email,
        };
        setCustomerList((prev) => [...prev, adapted]);
        setData((prev) => ({ ...prev, customer_id: adapted.id.toString() }));
    };

    useEffect(() => {
        if (riskMode === 'single' && selectedClassId && data.risks.length === 0) {
            setData((prev) => ({
                ...prev,
                risks: [createEmptyRisk(selectedClassId, '', undefined)],
            }));
        }
    }, [riskMode, selectedClassId, data.risks.length, setData]);

    const handleRiskChange = (index: number, updates: Partial<QuoteRisk>) => {
        setData((prev) => ({
            ...prev,
            risks: prev.risks.map((risk, i) => (i === index ? { ...risk, ...updates } : risk)),
        }));
    };

    const addRisk = () => {
        setData((prev) => ({
            ...prev,
            risks: [...prev.risks, createEmptyRisk(selectedClassId, '', undefined)],
        }));
    };

    const removeRisk = (index: number) => {
        setData((prev) => ({
            ...prev,
            risks: prev.risks.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('quotes.store'), {
            onSuccess: () => {
                toast.success('Customer quote created successfully');
            },
            onError: (errs) => {
                console.log('Failed to create quote', errs);
                toast.error('Failed to create quote. Please check the form and try again.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Customer Quote" />

            <div className="space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Create Customer Quote</h1>
                    <p className="text-muted-foreground">
                        Configure customer details, policy class, risk schedule, premium details, and coverage terms.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Policy Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Customer / Proposer *</Label>
                                    <CustomerSearchSelect
                                        value={data.customer_id}
                                        initialCustomers={customerList as any}
                                        onChange={(customerId) => setData((prev) => ({ ...prev, customer_id: customerId }))}
                                    />
                                    {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                                </div>

                                <div>
                                    <Label>Currency</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData((prev) => ({ ...prev, currency: value }))}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="NGN">NGN (₦)</SelectItem>
                                            <SelectItem value="USD">USD ($)</SelectItem>
                                            <SelectItem value="EUR">EUR (€)</SelectItem>
                                            <SelectItem value="GBP">GBP (£)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Policy Type *</Label>
                                    <Popover open={typeSearchOpen} onOpenChange={setTypeSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between">
                                                {selectedTypeId
                                                    ? policyTypes.find((t) => t.id.toString() === selectedTypeId)?.name
                                                    : 'Select policy type...'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="Search types..." value={typeSearchQuery} onValueChange={setTypeSearchQuery} />
                                                <CommandList>
                                                    <CommandGroup>
                                                        {policyTypes
                                                            .filter((t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                                                            .map((t) => (
                                                                <div
                                                                    key={t.id}
                                                                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                                                    onClick={() => {
                                                                        setSelectedTypeId(t.id.toString());
                                                                        setSelectedClassId('');
                                                                        setData((prev) => ({ ...prev, risks: [] }));
                                                                        setTypeSearchOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn('h-4 w-4', selectedTypeId === t.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                                                    {t.name}
                                                                </div>
                                                            ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div>
                                    <Label>Policy Class *</Label>
                                    <Popover open={classSearchOpen} onOpenChange={setClassSearchOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" role="combobox" className="w-full justify-between" disabled={!selectedTypeId}>
                                                {selectedClassId
                                                    ? policyClasses.find((c) => c.id.toString() === selectedClassId)?.name
                                                    : selectedTypeId ? 'Select class...' : 'Select type first'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput placeholder="Search classes..." value={classSearchQuery} onValueChange={setClassSearchQuery} />
                                                <CommandList>
                                                    <CommandGroup>
                                                        {filteredClasses.map((c) => (
                                                            <div
                                                                key={c.id}
                                                                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                                                                onClick={() => {
                                                                    setSelectedClassId(c.id.toString());
                                                                    setData((prev) => ({ ...prev, policy_class_id: c.id.toString(), risks: [] }));
                                                                    setClassSearchOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn('h-4 w-4', selectedClassId === c.id.toString() ? 'opacity-100' : 'opacity-0')} />
                                                                {c.name}
                                                            </div>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div>
                                    <Label>Proposed Start Date</Label>
                                    <DatePickerSimple
                                        date={data.period_start ? new Date(data.period_start) : undefined}
                                        onSelect={(date) => setData((prev) => ({ ...prev, period_start: date ? dayjs(date).format('YYYY-MM-DD') : '' }))}
                                        placeholder="Start date"
                                    />
                                </div>
                                <div>
                                    <Label>Proposed End Date</Label>
                                    <DatePickerSimple
                                        date={data.period_end ? new Date(data.period_end) : undefined}
                                        onSelect={(date) => setData((prev) => ({ ...prev, period_end: date ? dayjs(date).format('YYYY-MM-DD') : '' }))}
                                        placeholder="End date"
                                    />
                                </div>
                                <div>
                                    <Label>Quote Valid Until *</Label>
                                    <DatePickerSimple
                                        date={data.valid_until ? new Date(data.valid_until) : undefined}
                                        onSelect={(date) => setData((prev) => ({ ...prev, valid_until: date ? dayjs(date).format('YYYY-MM-DD') : '' }))}
                                        placeholder="Validity date"
                                    />
                                    {errors.valid_until && <p className="mt-1 text-sm text-red-600">{errors.valid_until}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedClassId ? (
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{riskMode === 'single' ? 'Coverage Details' : 'Risk Schedule'}</CardTitle>
                                    {riskMode !== 'single' && (
                                        <Button type="button" variant="outline" size="sm" onClick={addRisk}>
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Add Risk Item
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.risks.map((risk, index) => (
                                    <RiskScheduleItem
                                        key={index}
                                        index={index}
                                        risk={risk}
                                        riskMode={riskMode}
                                        policyTypes={policyTypes}
                                        policyClasses={policyClasses}
                                        policyProducts={policyProducts}
                                        onChange={handleRiskChange}
                                        onRemove={riskMode === 'single' ? () => {} : removeRisk}
                                        errors={errors}
                                    />
                                ))}

                                <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-4">
                                    <div>
                                        <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                        <Input
                                            id="commission_rate"
                                            type="number"
                                            step="any"
                                            value={data.commission_rate}
                                            onChange={(e) => setData((prev) => ({ ...prev, commission_rate: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="fees">Additional Fees</Label>
                                        <Input
                                            id="fees"
                                            type="number"
                                            step="any"
                                            value={data.fees}
                                            onChange={(e) => setData((prev) => ({ ...prev, fees: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            type="number"
                                            step="any"
                                            value={data.tax_rate}
                                            onChange={(e) => setData((prev) => ({ ...prev, tax_rate: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="discount">Discount</Label>
                                        <Input
                                            id="discount"
                                            type="number"
                                            step="any"
                                            value={data.discount}
                                            onChange={(e) => setData((prev) => ({ ...prev, discount: e.target.value }))}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <FinancialSummary
                                    risks={data.risks}
                                    commissionRate={data.commission_rate}
                                    fees={data.fees}
                                    taxRate={data.tax_rate}
                                    currency={data.currency}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Schedule</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Select a Policy Type and Policy Class to configure risk items and coverage details.</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Terms & Payment Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="claim_payment_condition">Payment & Warranty Conditions</Label>
                                <Textarea
                                    id="claim_payment_condition"
                                    value={data.claim_payment_condition}
                                    onChange={(e) => setData((prev) => ({ ...prev, claim_payment_condition: e.target.value }))}
                                    placeholder="e.g., Premium payment warranty 30 days from inception date..."
                                    rows={3}
                                />
                            </div>
                            <div>
                                <Label htmlFor="notes">Special Notes for Customer</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData((prev) => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Enter additional notes or terms to display on the quote document..."
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Link href={route('quotes.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Customer Quote'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
