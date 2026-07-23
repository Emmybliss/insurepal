import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import BrokerSlipSearchCombobox from '@/components/insurance/BrokerSlipSearchCombobox';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import { cn, formatAmount } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus, Save, Upload } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    name: string;
    email: string;
    phone: string;
    type: string;
}

interface PreferredUnderwriter {
    id: number;
    name: string;
}

interface PolicyType {
    id: number;
    name: string;
}

interface PolicyClass {
    id: number;
    name: string;
    policy_type_id?: number;
}

interface PolicyProduct {
    id: number;
    name: string;
    code: string;
    base_premium: number;
    commission_rate: number;
    min_sum_assured: number;
    max_sum_assured: number;
    policy_type?: PolicyType;
    policy_class?: PolicyClass;
    policy_type_id?: number;
    policy_class_id?: number;
    preferred_underwriters: PreferredUnderwriter[];
}

interface Props {
    customers: Customer[];
    policyProducts: PolicyProduct[];
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
}

interface FormData {
    customer_id: string;
    policy_type_id: string;
    policy_class_id: string;
    policy_product_id: string;
    policy_number: string;
    broker_slip_number: string;
    placement_date: string;
    insurer_id: string;
    insurer_name: string;
    effective_date: string;
    expiry_date: string;
    sum_insured: string;
    premium_amount: string;
    commission_amount: string;
    commission_rate: string;
    currency: string;
    payment_method: string;
    payment_date: string;
    is_direct_to_insurer: boolean;
    coverage_details: {
        sum_assured: string;
        deductible: string;
    };
    payment_frequency: string;
    notes: string;
    schedule_file: File | null;
    broker_slip_file: File | null;
}

export default function RecordPlacedPolicy({ customers, policyProducts, policyTypes, policyClasses }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PolicyProduct | null>(null);
    const [effectiveOpen, setEffectiveOpen] = useState(false);
    const [expiryOpen, setExpiryOpen] = useState(false);
    const [placementOpen, setPlacementOpen] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [productSearchOpen, setProductSearchOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [premiumAmountFocused, setPremiumAmountFocused] = useState(false);
    const [commissionAmountFocused, setCommissionAmountFocused] = useState(false);
    const [stayOnPage, setStayOnPage] = useState(false);
    const [scheduleFileName, setScheduleFileName] = useState('');
    const [brokerSlipFileName, setBrokerSlipFileName] = useState('');

    const { data, setData, post, processing, errors, reset } = useForm<FormData>({
        customer_id: '',
        policy_type_id: '',
        policy_class_id: '',
        policy_product_id: '',
        policy_number: '',
        broker_slip_number: '',
        placement_date: '',
        insurer_id: '',
        insurer_name: '',
        effective_date: '',
        expiry_date: '',
        sum_insured: '',
        premium_amount: '',
        commission_amount: '',
        commission_rate: '',
        currency: 'NGN',
        payment_method: '',
        payment_date: '',
        is_direct_to_insurer: false,
        coverage_details: {
            sum_assured: '',
            deductible: '',
        },
        payment_frequency: '',
        notes: '',
        schedule_file: null,
        broker_slip_file: null,
    });

    const filteredClasses = selectedTypeId ? policyClasses.filter((c) => c.policy_type_id?.toString() === selectedTypeId) : [];

    const filteredProducts = selectedClassId
        ? policyProducts.filter((p) => p.policy_class?.id?.toString() === selectedClassId)
        : selectedTypeId
          ? policyProducts.filter((p) => p.policy_type?.id?.toString() === selectedTypeId)
          : policyProducts;

    const handleCustomerCreated = (newCustomer: import('@/types').Customer) => {
        const adapted: Customer = {
            id: newCustomer.id,
            name: newCustomer.display_name,
            email: newCustomer.email,
            phone: newCustomer.phone ?? '',
            type: newCustomer.type,
        };
        setCustomerList((prev) => [...prev, adapted]);
        setData('customer_id', adapted.id.toString());
    };

    const handleProductSelect = (product: PolicyProduct) => {
        setSelectedProduct(product);
        setData('policy_product_id', product.id.toString());
        setData('policy_type_id', product.policy_type?.id?.toString() || '');
        setData('policy_class_id', product.policy_class?.id?.toString() || '');
        setData('commission_rate', product.commission_rate.toString());
        setData('commission_amount', (parseFloat(data.premium_amount || '0') * (product.commission_rate / 100)).toFixed(2));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('policy-management.store-placed'), {
            forceFormData: true,
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Placed policy recorded successfully');
                if (stayOnPage) {
                    reset();
                    setSelectedProduct(null);
                    setSelectedTypeId('');
                    setSelectedClassId('');
                    setScheduleFileName('');
                    setBrokerSlipFileName('');
                }
            },
            onError: (errors) => {
                const message = errors.general || Object.values(errors).flat().join(', ');
                console.log(message);
                toast.error('Error recording policy. Please check the form or console log for errors.');
            },
        });
    };

    return (
        <AppSidebarLayout>
            <Head title="Record Placed Policy" />

            <div className="flex flex-1 flex-col space-y-8 p-8">
                <div className="flex items-center justify-between space-y-2">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">Record Placed Policy</h2>
                            <p className="text-muted-foreground">Record a policy issued by an underwriter</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" encType="multipart/form-data">
                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Customer & Product Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer & Product</CardTitle>
                                <CardDescription>Select the insured customer and insurance product</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customerList.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {customer.name} - {customer.email}
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
                                    {errors.customer_id && <p className="text-sm text-red-600">{errors.customer_id}</p>}
                                    <CustomerCreateModal
                                        open={customerModalOpen}
                                        onOpenChange={setCustomerModalOpen}
                                        onCustomerCreated={handleCustomerCreated}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Policy Type</Label>
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
                                                {selectedTypeId
                                                    ? policyTypes.find((t) => t.id.toString() === selectedTypeId)?.name
                                                    : 'Select type...'}
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
                                                    {policyTypes.filter(
                                                        (t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()),
                                                    ).length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">No type found.</div>
                                                    ) : (
                                                        <CommandGroup>
                                                            {policyTypes
                                                                .filter(
                                                                    (t) =>
                                                                        !typeSearchQuery ||
                                                                        t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()),
                                                                )
                                                                .map((t) => (
                                                                    <div
                                                                        key={t.id}
                                                                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                        onClick={() => {
                                                                            setSelectedTypeId(t.id.toString());
                                                                            setSelectedClassId('');
                                                                            setSelectedProduct(null);
                                                                            setData('policy_type_id', t.id.toString());
                                                                            setData('policy_class_id', '');
                                                                            setData('policy_product_id', '');
                                                                            setTypeSearchOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'h-4 w-4',
                                                                                selectedTypeId === t.id.toString() ? 'opacity-100' : 'opacity-0',
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
                                </div>

                                <div className="space-y-2">
                                    <Label>Policy Class</Label>
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
                                                disabled={!selectedTypeId}
                                            >
                                                {selectedClassId
                                                    ? policyClasses.find((c) => c.id.toString() === selectedClassId)?.name
                                                    : selectedTypeId
                                                      ? 'Select class...'
                                                      : 'Select type first'}
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
                                                    {filteredClasses.filter(
                                                        (c) => !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase()),
                                                    ).length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">No class found.</div>
                                                    ) : (
                                                        <CommandGroup>
                                                            {filteredClasses
                                                                .filter(
                                                                    (c) =>
                                                                        !classSearchQuery ||
                                                                        c.name.toLowerCase().includes(classSearchQuery.toLowerCase()),
                                                                )
                                                                .map((c) => (
                                                                    <div
                                                                        key={c.id}
                                                                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                        onClick={() => {
                                                                            setSelectedClassId(c.id.toString());
                                                                            setSelectedProduct(null);
                                                                            setData('policy_class_id', c.id.toString());
                                                                            setData('policy_product_id', '');
                                                                            setClassSearchOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'h-4 w-4',
                                                                                selectedClassId === c.id.toString() ? 'opacity-100' : 'opacity-0',
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
                                </div>

                                <div className="space-y-2">
                                    <Label>Insurance Product *</Label>
                                    <Popover
                                        open={productSearchOpen}
                                        onOpenChange={(open) => {
                                            setProductSearchOpen(open);
                                            if (!open) setProductSearchQuery('');
                                        }}
                                    >
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={productSearchOpen}
                                                className="w-full justify-between"
                                                disabled={!selectedClassId}
                                            >
                                                {selectedProduct
                                                    ? `${selectedProduct.name} (${selectedProduct.code})`
                                                    : selectedClassId
                                                      ? 'Select product...'
                                                      : 'Select class first'}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search products..."
                                                    value={productSearchQuery}
                                                    onValueChange={setProductSearchQuery}
                                                />
                                                <CommandList>
                                                    {filteredProducts.filter((product) => {
                                                        if (!productSearchQuery) return true;
                                                        const q = productSearchQuery.toLowerCase();
                                                        return product.name.toLowerCase().includes(q) || product.code.toLowerCase().includes(q);
                                                    }).length === 0 ? (
                                                        <div className="py-6 text-center text-sm text-muted-foreground">No product found.</div>
                                                    ) : (
                                                        <CommandGroup>
                                                            {filteredProducts
                                                                .filter((product) => {
                                                                    if (!productSearchQuery) return true;
                                                                    const q = productSearchQuery.toLowerCase();
                                                                    return (
                                                                        product.name.toLowerCase().includes(q) ||
                                                                        product.code.toLowerCase().includes(q)
                                                                    );
                                                                })
                                                                .map((product) => (
                                                                    <div
                                                                        key={product.id}
                                                                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                        onClick={() => {
                                                                            handleProductSelect(product);
                                                                            setProductSearchOpen(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'h-4 w-4',
                                                                                selectedProduct?.id === product.id ? 'opacity-100' : 'opacity-0',
                                                                            )}
                                                                        />
                                                                        {product.name} ({product.code})
                                                                    </div>
                                                                ))}
                                                        </CommandGroup>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {errors.policy_product_id && <p className="text-sm text-red-600">{errors.policy_product_id}</p>}
                                </div>

                                {/* {selectedProduct && (
                                    <div className="rounded-lg bg-muted p-4">
                                        <h4 className="mb-2 font-medium">Product Details</h4>
                                        <div className="space-y-2 text-sm">
                                            {selectedProduct.policy_type && (
                                                <p>
                                                    <strong>Type:</strong> {selectedProduct.policy_type.name}
                                                </p>
                                            )}
                                            {selectedProduct.policy_class && (
                                                <p>
                                                    <strong>Class:</strong> {selectedProduct.policy_class.name}
                                                </p>
                                            )}
                                            <p>
                                                <strong>Base Premium:</strong> {formatCurrency(selectedProduct.base_premium)}
                                            </p>
                                            <div>
                                                <Label htmlFor="commission_rate" className="text-xs font-medium">
                                                    Commission Rate (%)
                                                </Label>
                                                <Input
                                                    id="commission_rate"
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    step="0.01"
                                                    value={data.commission_rate}
                                                    onChange={(e) => {
                                                        const rate = e.target.value;
                                                        setData('commission_rate', rate);
                                                        setData(
                                                            'commission_amount',
                                                            (parseFloat(data.premium_amount || '0') * (parseFloat(rate || '0') / 100)).toFixed(2),
                                                        );
                                                    }}
                                                    className="mt-1 h-8 text-sm"
                                                />
                                            </div>
                                            {selectedProduct.preferred_underwriters?.length > 0 && (
                                                <p className="pt-1">
                                                    <strong>Preferred Underwriters:</strong>{' '}
                                                    {selectedProduct.preferred_underwriters.map((u) => u.name).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )} */}
                            </CardContent>
                        </Card>

                        {/* Policy Details & Insurer */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Details</CardTitle>
                                <CardDescription>Enter the policy number and insurer information from the underwriter</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="policy_number">
                                        Policy Number (from Underwriter){' '}
                                        <span className="text-xs font-normal text-muted-foreground">
                                            (Optional — leave blank if not yet issued by insurer)
                                        </span>
                                    </Label>
                                    <Input
                                        id="policy_number"
                                        value={data.policy_number}
                                        onChange={(e) => setData('policy_number', e.target.value)}
                                        placeholder="e.g. MTR-2026-00000001 (Optional)"
                                    />
                                    {errors.policy_number && <p className="text-sm text-red-600">{errors.policy_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="broker_slip_number">Broker Slip Number</Label>
                                    <BrokerSlipSearchCombobox
                                        value={data.broker_slip_number}
                                        onSelect={(value) => setData('broker_slip_number', value)}
                                        customerId={data.customer_id}
                                        placeholder={data.customer_id ? 'Search or type broker slip number...' : 'Select a customer first...'}
                                    />
                                    {errors.broker_slip_number && <p className="text-sm text-red-600">{errors.broker_slip_number}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="placement_date">Placement Date *</Label>
                                    <DatePickerSimple
                                        date={data.placement_date ? new Date(data.placement_date) : undefined}
                                        onSelect={(date) => setData('placement_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Pick placement date"
                                    />
                                    {errors.placement_date && <p className="text-sm text-red-600">{errors.placement_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label>Insurer (Underwriter) *</Label>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        value={data.insurer_name}
                                        scope="tenant"
                                        onSelect={(company) =>
                                            setData((prev) => ({
                                                ...prev,
                                                insurer_name: company.name,
                                                insurer_id: String(company.company_id || company.id),
                                            }))
                                        }
                                        placeholder="Search for an insurance company..."
                                    />
                                    {errors.insurer_name && <p className="text-sm text-red-600">{errors.insurer_name}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Policy Period */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Period</CardTitle>
                                <CardDescription>Set the policy effective and expiry dates from the underwriter schedule</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="effective_date">Effective Date *</Label>
                                    <DatePickerSimple
                                        date={data.effective_date ? new Date(data.effective_date) : undefined}
                                        onSelect={(date) => setData('effective_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Pick effective date"
                                    />
                                    {errors.effective_date && <p className="text-sm text-red-600">{errors.effective_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date *</Label>
                                    <DatePickerSimple
                                        date={data.expiry_date ? new Date(data.expiry_date) : undefined}
                                        onSelect={(date) => setData('expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Pick expiry date"
                                        disabledDate={(date) =>
                                            data.effective_date
                                                ? date < dayjs(data.effective_date).toDate()
                                                : date < new Date(new Date().setDate(new Date().getDate() - 1))
                                        }
                                    />
                                    {errors.expiry_date && <p className="text-sm text-red-600">{errors.expiry_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_frequency">Payment Frequency</Label>
                                    <Select value={data.payment_frequency} onValueChange={(value) => setData('payment_frequency', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                            <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                                            <SelectItem value="annual">Annual</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Premium & Financial Details (NAICOM 7.2B) */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Premium & Financial Details (NAICOM 7.2B)</CardTitle>
                                <CardDescription>Enter sum insured, premium, currency, and payment details for NAICOM Form 7.2B compliance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sum_insured">Sum Insured (Total Coverage Amount) *</Label>
                                    <Input
                                        id="sum_insured"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.sum_insured}
                                        onChange={(e) => setData('sum_insured', e.target.value)}
                                        placeholder="e.g. 50000000.00"
                                    />
                                    {errors.sum_insured && <p className="text-sm text-red-600">{errors.sum_insured}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="premium_amount">Gross Premium Amount *</Label>
                                        <Input
                                            id="premium_amount"
                                            type="text"
                                            inputMode="decimal"
                                            min="0"
                                            value={premiumAmountFocused ? data.premium_amount : formatAmount(data.premium_amount)}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/,/g, '');
                                                if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                                    setData('premium_amount', raw);
                                                    const rate = parseFloat(data.commission_rate || '0');
                                                    const commission = parseFloat(raw || '0') * (rate / 100);
                                                    setData('commission_amount', commission.toFixed(2));
                                                }
                                            }}
                                            onFocus={() => setPremiumAmountFocused(true)}
                                            onBlur={() => setPremiumAmountFocused(false)}
                                            placeholder="Enter premium amount"
                                        />
                                        {errors.premium_amount && <p className="text-sm text-red-600">{errors.premium_amount}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="currency">Currency *</Label>
                                        <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                            <SelectTrigger id="currency">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGN">NGN (Nigerian Naira - Local)</SelectItem>
                                                <SelectItem value="USD">USD (US Dollar - Foreign)</SelectItem>
                                                <SelectItem value="EUR">EUR (Euro - Foreign)</SelectItem>
                                                <SelectItem value="GBP">GBP (British Pound - Foreign)</SelectItem>
                                                <SelectItem value="CAD">CAD (Canadian Dollar - Foreign)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.currency && <p className="text-sm text-red-600">{errors.currency}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="commission_amount">Commission Amount</Label>
                                    <Input
                                        id="commission_amount"
                                        type="text"
                                        inputMode="decimal"
                                        min="0"
                                        value={commissionAmountFocused ? data.commission_amount : formatAmount(data.commission_amount)}
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/,/g, '');
                                            if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                                setData('commission_amount', raw);
                                            }
                                        }}
                                        onFocus={() => setCommissionAmountFocused(true)}
                                        onBlur={() => setCommissionAmountFocused(false)}
                                        placeholder="Enter commission amount"
                                    />
                                    {errors.commission_amount && <p className="text-sm text-red-600">{errors.commission_amount}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_method">Payment Method (NAICOM 7.2B)</Label>
                                        <Select value={data.payment_method} onValueChange={(value) => setData('payment_method', value)}>
                                            <SelectTrigger id="payment_method">
                                                <SelectValue placeholder="Select payment method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                                <SelectItem value="cheque">Cheque</SelectItem>
                                                <SelectItem value="direct_deposit">Direct Deposit</SelectItem>
                                                <SelectItem value="cash">Cash</SelectItem>
                                                <SelectItem value="electronic_transfer">Electronic / Web</SelectItem>
                                                <SelectItem value="card">Debit / Credit Card</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.payment_method && <p className="text-sm text-red-600">{errors.payment_method}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment_date">Payment Date / Date Received</Label>
                                        <DatePickerSimple
                                            date={data.payment_date ? new Date(data.payment_date) : undefined}
                                            onSelect={(date) => setData('payment_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                            placeholder="Pick payment date"
                                        />
                                        {errors.payment_date && <p className="text-sm text-red-600">{errors.payment_date}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center space-x-2 pt-2">
                                    <Checkbox
                                        id="is_direct_to_insurer"
                                        checked={data.is_direct_to_insurer}
                                        onCheckedChange={(checked) => setData('is_direct_to_insurer', checked === true)}
                                    />
                                    <Label htmlFor="is_direct_to_insurer" className="cursor-pointer text-sm font-medium leading-none">
                                        Premium paid direct to insurer by insured (By-passing broker)
                                    </Label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* File Uploads */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Uploads</CardTitle>
                                <CardDescription>Upload the schedule from the underwriter and the broker slip</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="schedule_file">Upload Schedule (from Underwriter)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('schedule_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {scheduleFileName || 'Choose file...'}
                                        </Button>
                                        <input
                                            id="schedule_file_input"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData('schedule_file', file);
                                                    setScheduleFileName(file.name);
                                                }
                                            }}
                                        />
                                    </div>
                                    {errors.schedule_file && <p className="text-sm text-red-600">{errors.schedule_file}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="broker_slip_file">Upload Broker Slip (Optional)</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('broker_slip_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {brokerSlipFileName || 'Choose file...'}
                                        </Button>
                                        <input
                                            id="broker_slip_file_input"
                                            type="file"
                                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setData('broker_slip_file', file);
                                                    setBrokerSlipFileName(file.name);
                                                }
                                            }}
                                        />
                                    </div>
                                    {errors.broker_slip_file && <p className="text-sm text-red-600">{errors.broker_slip_file}</p>}
                                </div>
                            </CardContent>
                        </Card>
                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Additional Notes</CardTitle>
                                <CardDescription>Add any special notes or instructions for this recorded policy</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Enter any additional notes..."
                                    rows={4}
                                />
                                {errors.notes && <p className="mt-2 text-sm text-red-600">{errors.notes}</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Checkbox id="stayOnPage" checked={stayOnPage} onCheckedChange={(checked) => setStayOnPage(checked === true)} />
                            <Label htmlFor="stayOnPage" className="cursor-pointer text-sm font-normal">
                                Stay on this page after I click Record Policy
                            </Label>
                        </div>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" asChild>
                                <Link href={route('policy-management.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Recording Policy...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Record Policy
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppSidebarLayout>
    );
}
