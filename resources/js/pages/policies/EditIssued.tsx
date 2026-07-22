import BrokerSlipSearchCombobox from '@/components/insurance/BrokerSlipSearchCombobox';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { ArrowLeft, CalendarIcon, Check, ChevronsUpDown, Download, FileText, Save, Upload } from 'lucide-react';
import React, { useState } from 'react';

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
    policy_type?: PolicyType;
    policy_class?: PolicyClass;
    policy_type_id?: number;
    policy_class_id?: number;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    source_type: string;
    effective_date: string;
    expiry_date: string;
    premium_amount?: number;
    commission_amount?: number;
    commission_rate?: number;
    payment_frequency?: string;
    notes?: string;
    internal_notes?: string;
    broker_slip_number?: string;
    placement_date?: string;
    insurer_id?: string;
    insurer_name?: string;
    insurer_address?: string;
    insurer_email?: string;
    insurer_phone?: string;
    schedule_file_path?: string;
    broker_slip_file_path?: string;
    policy_type_id?: number;
    policy_class_id?: number;
    policy_product_id?: number;
    customer: {
        id: number;
        first_name: string;
        last_name: string;
        company_name?: string;
    };
    policy_product: {
        id: number;
        name: string;
        code: string;
        policy_type?: PolicyType;
        policy_class?: PolicyClass;
        base_premium?: number;
        commission_rate?: number;
    };
}

interface Props {
    policy: Policy;
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
    policyProducts: PolicyProduct[];
}

const storageUrl = (path: string) => `/storage/${path}`;

export default function EditIssued({ policy, policyTypes, policyClasses, policyProducts }: Props) {
    const [placementOpen, setPlacementOpen] = useState(false);
    const [scheduleFileName, setScheduleFileName] = useState('');
    const [brokerSlipFileName, setBrokerSlipFileName] = useState('');
    const [selectedTypeId, setSelectedTypeId] = useState(policy.policy_product?.policy_type?.id?.toString() || '');
    const [selectedClassId, setSelectedClassId] = useState(policy.policy_product?.policy_class?.id?.toString() || '');
    const [selectedProduct, setSelectedProduct] = useState<PolicyProduct | null>(
        policyProducts.find((p) => p.id === policy.policy_product_id) || null,
    );
    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [productSearchOpen, setProductSearchOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');

    const filteredClasses = selectedTypeId ? policyClasses.filter((c) => c.policy_type_id?.toString() === selectedTypeId) : [];

    const filteredProducts = selectedClassId
        ? policyProducts.filter((p) => p.policy_class?.id?.toString() === selectedClassId)
        : selectedTypeId
          ? policyProducts.filter((p) => p.policy_type?.id?.toString() === selectedTypeId)
          : policyProducts;

    const { data, setData, put, processing, errors } = useForm({
        status: policy.status,
        policy_type_id: String(policy.policy_type_id || policy.policy_product?.policy_type?.id || ''),
        policy_class_id: String(policy.policy_class_id || policy.policy_product?.policy_class?.id || ''),
        policy_product_id: String(policy.policy_product_id || policy.policy_product?.id || ''),
        effective_date: policy.effective_date.split('T')[0],
        expiry_date: policy.expiry_date.split('T')[0],
        premium_amount: String(policy.premium_amount ?? ''),
        commission_amount: String(policy.commission_amount ?? ''),
        commission_rate: String(policy.commission_rate ?? ''),
        payment_frequency: policy.payment_frequency || '',
        notes: policy.notes || '',
        internal_notes: policy.internal_notes || '',
        insurer_id: policy.insurer_id || '',
        insurer_source: '',
        insurer_name: policy.insurer_name || '',
        insurer_address: policy.insurer_address || '',
        insurer_email: policy.insurer_email || '',
        insurer_phone: policy.insurer_phone || '',
        broker_slip_number: policy.broker_slip_number || '',
        placement_date: policy.placement_date ? policy.placement_date.split('T')[0] : '',
        schedule_file: null as File | null,
        broker_slip_file: null as File | null,
    });

    const handleProductSelect = (product: PolicyProduct) => {
        setSelectedProduct(product);
        setData('policy_product_id', product.id.toString());
        setData('policy_type_id', product.policy_type?.id?.toString() || '');
        setData('policy_class_id', product.policy_class?.id?.toString() || '');
        setData('commission_rate', String(product.commission_rate ?? ''));
        setData('commission_amount', (parseFloat(String(data.premium_amount || '0')) * ((product.commission_rate ?? 0) / 100)).toFixed(2));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('policy-management.update', policy.id), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const getCustomerName = () => {
        return policy.customer.company_name || `${policy.customer.first_name} ${policy.customer.last_name}`;
    };

    const isBrokerRecorded = policy.source_type === 'BROKER_RECORDED';

    return (
        <AppLayout>
            <Head title={`Edit Policy: ${policy.policy_number}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={route('policy-management.show', policy.id)}
                            className="flex items-center text-sm text-muted-foreground hover:text-primary"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Policy
                        </Link>
                        <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit Policy: {policy.policy_number}</h1>
                        <p className="text-muted-foreground">
                            {policy.policy_product.name} for {getCustomerName()}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid gap-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Policy Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Policy Number</Label>
                                    <Input value={policy.policy_number} disabled />
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
                                </div>

                                {selectedProduct && (
                                    <div className="rounded-lg bg-muted p-3">
                                        <h4 className="mb-1 text-sm font-medium">Product Details</h4>
                                        <div className="space-y-1 text-xs">
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
                                            {selectedProduct.base_premium != null && (
                                                <p>
                                                    <strong>Base Premium:</strong> {formatCurrency(selectedProduct.base_premium)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {isBrokerRecorded && (
                                    <>
                                        <div className="space-y-2">
                                            <Label htmlFor="broker_slip_number">Broker Slip Number</Label>
                                            <BrokerSlipSearchCombobox
                                                value={data.broker_slip_number}
                                                onSelect={(value) => setData('broker_slip_number', value)}
                                                customerId={policy.customer.id}
                                                placeholder="Search or type broker slip number..."
                                            />
                                            {errors.broker_slip_number && <p className="text-sm text-red-600">{errors.broker_slip_number}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="placement_date">Placement Date</Label>
                                            <Popover open={placementOpen} onOpenChange={setPlacementOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            'w-full justify-start text-left font-normal',
                                                            !data.placement_date && 'text-muted-foreground',
                                                        )}
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {data.placement_date ? (
                                                            dayjs(data.placement_date).format('MMMM D, YYYY')
                                                        ) : (
                                                            <span>Pick a date</span>
                                                        )}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={data.placement_date ? dayjs(data.placement_date).toDate() : undefined}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                setData('placement_date', dayjs(date).format('YYYY-MM-DD'));
                                                            }
                                                            setPlacementOpen(false);
                                                        }}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            {errors.placement_date && <p className="text-sm text-red-600">{errors.placement_date}</p>}
                                        </div>
                                    </>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="insurer">Insurer (Underwriter)</Label>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        value={data.insurer_name}
                                        scope="tenant"
                                        onSelect={(company) => {
                                            setData((prev) => ({
                                                ...prev,
                                                insurer_name: company.name,
                                                insurer_address: company.address || '',
                                                insurer_email: company.email || '',
                                                insurer_phone: company.phone || '',
                                                insurer_id: String(company.company_id || company.id),
                                                insurer_source: company.source,
                                            }));
                                        }}
                                        placeholder="Search for an insurance company..."
                                    />
                                    {errors.insurer_id && <p className="text-sm text-red-600">{errors.insurer_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Policy Status</Label>
                                    <Select value={data.status} onValueChange={(value) => setData('status', value)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="recorded">Recorded</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                            <SelectItem value="suspended">Suspended</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_frequency">Payment Frequency</Label>
                                    <Select value={data.payment_frequency} onValueChange={(value) => setData('payment_frequency', value)}>
                                        <SelectTrigger id="payment_frequency">
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

                        {/* Policy Period */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Policy Period</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="effective_date">Effective Date</Label>
                                    <DatePickerSimple
                                        date={data.effective_date ? new Date(data.effective_date) : undefined}
                                        onSelect={(date) => setData('effective_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select effective date"
                                    />
                                    {errors.effective_date && <p className="text-sm text-red-500">{errors.effective_date}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_date">Expiry Date</Label>
                                    <DatePickerSimple
                                        date={data.expiry_date ? new Date(data.expiry_date) : undefined}
                                        onSelect={(date) => setData('expiry_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select expiry date"
                                    />
                                    {errors.expiry_date && <p className="text-sm text-red-500">{errors.expiry_date}</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="premium_amount">Premium Amount (₦)</Label>
                                    <Input
                                        id="premium_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.premium_amount}
                                        onChange={(e) => {
                                            setData('premium_amount', e.target.value);
                                            const rate = parseFloat(data.commission_rate || '0');
                                            const commission = parseFloat(e.target.value || '0') * (rate / 100);
                                            setData('commission_amount', commission.toFixed(2));
                                        }}
                                        placeholder="Enter premium amount"
                                    />
                                    {errors.premium_amount && <p className="text-sm text-red-600">{errors.premium_amount}</p>}
                                </div>

                                {isBrokerRecorded && (
                                    <div className="space-y-2">
                                        <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                        <Input
                                            id="commission_rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={data.commission_rate}
                                            onChange={(e) => {
                                                setData('commission_rate', e.target.value);
                                                const premium = parseFloat(data.premium_amount || '0');
                                                const commission = premium * (parseFloat(e.target.value || '0') / 100);
                                                setData('commission_amount', commission.toFixed(2));
                                            }}
                                            placeholder="Enter commission rate"
                                        />
                                        {errors.commission_rate && <p className="text-sm text-red-600">{errors.commission_rate}</p>}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="commission_amount">Commission Amount (₦)</Label>
                                    <Input
                                        id="commission_amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.commission_amount}
                                        onChange={(e) => setData('commission_amount', e.target.value)}
                                        placeholder="Enter commission amount"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Document Uploads */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Document Uploads</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Schedule File</Label>
                                    {policy.schedule_file_path && (
                                        <div className="mb-2 flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">Current file:</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0"
                                                onClick={() => window.open(storageUrl(policy.schedule_file_path!), '_blank')}
                                            >
                                                <Download className="mr-1 h-3 w-3" />
                                                View Schedule
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('schedule_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {scheduleFileName || (policy.schedule_file_path ? 'Replace file...' : 'Choose file...')}
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
                                    <Label>Broker Slip File</Label>
                                    {policy.broker_slip_file_path && (
                                        <div className="mb-2 flex items-center gap-2 text-sm">
                                            <FileText className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">Current file:</span>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0"
                                                onClick={() => window.open(storageUrl(policy.broker_slip_file_path!), '_blank')}
                                            >
                                                <Download className="mr-1 h-3 w-3" />
                                                View Broker Slip
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => document.getElementById('broker_slip_file_input')?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            {brokerSlipFileName || (policy.broker_slip_file_path ? 'Replace file...' : 'Choose file...')}
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
                    </div>

                    {/* Notes */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="notes">Policy Notes (Visible to Customer)</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Enter policy notes..."
                                    value={data.notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="internal_notes">Internal Notes (Staff Only)</Label>
                                <Textarea
                                    id="internal_notes"
                                    placeholder="Enter internal staff notes..."
                                    value={data.internal_notes}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('internal_notes', e.target.value)}
                                    rows={4}
                                />
                                {errors.internal_notes && <p className="text-sm text-red-500">{errors.internal_notes}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Link href={route('policy-management.show', policy.id)}>
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
