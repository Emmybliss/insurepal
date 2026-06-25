import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import { Calculator, Plus, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: string;
    first_name: string;
    last_name: string;
    company_name: string;
    email: string;
}

interface PolicyClass {
    id: number;
    name: string;
}

interface PolicyProduct {
    id: number;
    name: string;
    policyClass?: PolicyClass;
}

interface ClauseLibraryItem {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_system: boolean;
}

interface SlipItem {
    description: string;
    sum_insured: string;
    rate: string;
    rate_basis: string;
    premium: string;
    item_type: string;
}

interface SlipClause {
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
}

interface FormData {
    customer_id: string;
    policy_product_id: string;
    insurance_company_id: string;
    currency: string;
    sum_insured: string;
    rate: string;
    rate_basis: string;
    gross_premium: string;
    commission_rate: string;
    commission_amount: string;
    co_broker_commission: string;
    reporting_broker_commission: string;
    fees: string;
    taxes: string;
    discount: string;
    net_premium: string;
    period_start: string;
    period_end: string;
    claim_payment_condition: string;
    risk_details: string;
    notes: string;
    items: SlipItem[];
    clauses: SlipClause[];
}

interface Props {
    customers: Customer[];
    policyProducts: PolicyProduct[];
    clauseLibrary: ClauseLibraryItem[];
}

const rateBasisOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'per_mille', label: 'Per Mille (‰)' },
    { value: 'fixed', label: 'Fixed Amount' },
];

const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'NGN', label: 'NGN (₦)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
];

function getCustomerName(customer: Customer): string {
    if (customer.type === 'corporate') return customer.company_name;
    return `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();
}

export default function CreateDirect({ customers, policyProducts, clauseLibrary }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<PolicyProduct | undefined>(undefined);

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
        setData('customer_id', adapted.id.toString());
    };

    const [selectedCompanyName, setSelectedCompanyName] = useState('');

    const { data, setData, post, processing, errors } = useForm<FormData>({
        customer_id: '',
        policy_product_id: '',
        insurance_company_id: '',
        currency: 'USD',
        sum_insured: '',
        rate: '',
        rate_basis: 'percentage',
        gross_premium: '',
        commission_rate: '',
        commission_amount: '',
        co_broker_commission: '',
        reporting_broker_commission: '',
        fees: '',
        taxes: '',
        discount: '',
        net_premium: '',
        period_start: '',
        period_end: '',
        claim_payment_condition: '',
        risk_details: '',
        notes: '',
        items: [] as SlipItem[],
        clauses: [] as SlipClause[],
    });

    const updateProduct = (productId: string) => {
        setData('policy_product_id', productId);
        const product = policyProducts.find((p) => p.id.toString() === productId);
        setSelectedProduct(product);
    };

    const calculateItemPremium = (item: SlipItem): string => {
        const sumInsured = parseFloat(item.sum_insured) || 0;
        const rate = parseFloat(item.rate) || 0;

        let premium = 0;
        switch (item.rate_basis) {
            case 'percentage':
                premium = (sumInsured * rate) / 100;
                break;
            case 'per_mille':
                premium = (sumInsured * rate) / 1000;
                break;
            case 'fixed':
                premium = rate;
                break;
        }

        return premium.toFixed(2);
    };

    const handleItemChange = (index: number, field: keyof SlipItem, value: string) => {
        const updated = data.items.map((item, i) => {
            if (i !== index) return item;
            const newItem = { ...item, [field]: value };

            if (field === 'sum_insured' || field === 'rate' || field === 'rate_basis') {
                newItem.premium = calculateItemPremium(newItem);
            }

            return newItem;
        });

        setData('items', updated);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            {
                description: '',
                sum_insured: '',
                rate: '',
                rate_basis: 'percentage',
                premium: '',
                item_type: 'general',
            },
        ]);
    };

    const removeItem = (index: number) => {
        setData('items', data.items.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const sumInsured = parseFloat(data.sum_insured) || 0;
        const rate = parseFloat(data.rate) || 0;
        const rateBasis = data.rate_basis;
        const commissionRate = parseFloat(data.commission_rate) || 0;
        const coBrokerCommission = parseFloat(data.co_broker_commission) || 0;
        const reportingBrokerCommission = parseFloat(data.reporting_broker_commission) || 0;
        const fees = parseFloat(data.fees) || 0;
        const taxes = parseFloat(data.taxes) || 0;
        const discount = parseFloat(data.discount) || 0;

        let grossPremium = 0;
        switch (rateBasis) {
            case 'percentage':
                grossPremium = (sumInsured * rate) / 100;
                break;
            case 'per_mille':
                grossPremium = (sumInsured * rate) / 1000;
                break;
            case 'fixed':
                grossPremium = rate;
                break;
        }

        const commissionAmount = (grossPremium * commissionRate) / 100;
        const netPremium = Math.max(grossPremium - commissionAmount - coBrokerCommission - reportingBrokerCommission + fees + taxes - discount, 0);

        setData({
            ...data,
            gross_premium: grossPremium.toFixed(2),
            commission_amount: commissionAmount.toFixed(2),
            net_premium: netPremium.toFixed(2),
        });
    }, [
        data.sum_insured,
        data.rate,
        data.rate_basis,
        data.commission_rate,
        data.co_broker_commission,
        data.reporting_broker_commission,
        data.fees,
        data.taxes,
        data.discount,
    ]);

    const isClauseSelected = (clause: ClauseLibraryItem) => {
        return data.clauses.some((c) => c.title === clause.title && c.content === clause.content);
    };

    const toggleClause = (clause: ClauseLibraryItem) => {
        if (isClauseSelected(clause)) {
            setData(
                'clauses',
                data.clauses.filter((c) => !(c.title === clause.title && c.content === clause.content)),
            );
        } else {
            setData('clauses', [
                ...data.clauses,
                {
                    clause_type: clause.clause_type,
                    title: clause.title,
                    content: clause.content,
                    is_standard: clause.is_system,
                },
            ]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('broker-slips.store-direct'), {
            onSuccess: () => {
                toast.success('Broker slip created successfully');
            },
            onError: () => {
                toast.error('Failed to create broker slip. Please check the form and try again.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Create Broker Slip Directly" />

            <div className="space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Create Broker Slip Directly</h1>
                    <p className="text-muted-foreground">
                        Create a broker slip for simple, single-insurer business. A placement record will be created automatically.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className='col-span-2'>
                                    <Label>Customer / Insured *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select value={data.customer_id} onValueChange={(value) => setData('customer_id', value)}>
                                                <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customerList.map((c) => (
                                                        <SelectItem key={c.id} value={c.id.toString()}>
                                                            {getCustomerName(c)}
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
                                    {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                                    <CustomerCreateModal
                                        open={customerModalOpen}
                                        onOpenChange={setCustomerModalOpen}
                                        onCustomerCreated={handleCustomerCreated}
                                    />
                                </div>

                                <div>
                                    <Label>Insurance Company *</Label>
                                    <CompanySearchCombobox
                                        companyType="underwriter"
                                        value={selectedCompanyName}
                                        scope="tenant"
                                        onSelect={(company) => {
                                            setSelectedCompanyName(company.name);
                                            setData('insurance_company_id', (company.company_id || company.id).toString());
                                        }}
                                        onClear={() => {
                                            setSelectedCompanyName('');
                                            setData('insurance_company_id', '');
                                        }}
                                        placeholder="Search and select insurer..."
                                    />
                                    {errors.insurance_company_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.insurance_company_id}</p>
                                    )}
                                </div>

                                <div>
                                    <Label>Policy Product *</Label>
                                    <Select value={data.policy_product_id} onValueChange={updateProduct}>
                                        <SelectTrigger className={errors.policy_product_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {policyProducts.map((pp) => (
                                                <SelectItem key={pp.id} value={pp.id.toString()}>
                                                    {pp.name}
                                                    {pp.policyClass ? ` (${pp.policyClass.name})` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_product_id && (
                                        <p className="mt-1 text-sm text-red-600">{errors.policy_product_id}</p>
                                    )}
                                </div>

                            </div>



                            {selectedProduct && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Product Details</h4>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                                        <div>
                                            <dt className="text-muted-foreground">Product</dt>
                                            <dd className="font-medium">{selectedProduct.name}</dd>
                                        </div>
                                        {selectedProduct.policyClass && (
                                            <div>
                                                <dt className="text-muted-foreground">Class</dt>
                                                <dd className="font-medium">{selectedProduct.policyClass.name}</dd>
                                            </div>
                                        )}

                                    </dl>
                                </div>
                            )}

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Inception Date *</Label>
                                    <DatePickerSimple
                                        date={data.period_start ? new Date(data.period_start) : undefined}
                                        onSelect={(date) => setData('period_start', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select inception date"
                                    />
                                    {errors.period_start && <p className="mt-1 text-sm text-red-600">{errors.period_start}</p>}
                                </div>

                                <div>
                                    <Label>Expiry Date *</Label>
                                    <DatePickerSimple
                                        date={data.period_end ? new Date(data.period_end) : undefined}
                                        onSelect={(date) => setData('period_end', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select expiry date"
                                    />
                                    {errors.period_end && <p className="mt-1 text-sm text-red-600">{errors.period_end}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="risk_details">Risk Details</Label>
                                <Textarea
                                    id="risk_details"
                                    value={data.risk_details}
                                    onChange={(e) => setData('risk_details', e.target.value)}
                                    placeholder="Describe the risk being insured..."
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="claim_payment_condition">Claim Payment Condition</Label>
                                <Textarea
                                    id="claim_payment_condition"
                                    value={data.claim_payment_condition}
                                    onChange={(e) => setData('claim_payment_condition', e.target.value)}
                                    placeholder="e.g., 30 days after proof of loss"
                                    rows={2}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Premium Calculation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <Label>Currency</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((c) => (
                                                <SelectItem key={c.value} value={c.value}>
                                                    {c.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="sum_insured">Sum Insured *</Label>
                                    <Input
                                        id="sum_insured"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.sum_insured}
                                        onChange={(e) => setData('sum_insured', e.target.value)}
                                        className={errors.sum_insured ? 'border-red-500' : ''}
                                        placeholder="0.00"
                                    />
                                    {errors.sum_insured && <p className="mt-1 text-sm text-red-600">{errors.sum_insured}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="rate">Rate</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        step="0.0001"
                                        min={0}
                                        value={data.rate}
                                        onChange={(e) => setData('rate', e.target.value)}
                                        placeholder="0.0000"
                                    />
                                </div>

                                <div>
                                    <Label>Rate Basis</Label>
                                    <Select value={data.rate_basis} onValueChange={(value) => setData('rate_basis', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {rateBasisOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <Label htmlFor="gross_premium">Gross Premium *</Label>
                                    <Input
                                        id="gross_premium"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.gross_premium}
                                        onChange={(e) => setData('gross_premium', e.target.value)}
                                        className={errors.gross_premium ? 'border-red-500' : ''}
                                        readOnly
                                    />
                                    {errors.gross_premium && <p className="mt-1 text-sm text-red-600">{errors.gross_premium}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                                    <Input
                                        id="commission_rate"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        max={100}
                                        value={data.commission_rate}
                                        onChange={(e) => setData('commission_rate', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="commission_amount">Commission Amount</Label>
                                    <Input
                                        id="commission_amount"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.commission_amount}
                                        onChange={(e) => setData('commission_amount', e.target.value)}
                                        readOnly
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="net_premium">Net Premium *</Label>
                                    <Input
                                        id="net_premium"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.net_premium}
                                        onChange={(e) => setData('net_premium', e.target.value)}
                                        className={errors.net_premium ? 'border-red-500' : ''}
                                        readOnly
                                    />
                                    {errors.net_premium && <p className="mt-1 text-sm text-red-600">{errors.net_premium}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                <div>
                                    <Label htmlFor="co_broker_commission">Co-Broker Commission</Label>
                                    <Input
                                        id="co_broker_commission"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.co_broker_commission}
                                        onChange={(e) => setData('co_broker_commission', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="reporting_broker_commission">Reporting Broker Commission</Label>
                                    <Input
                                        id="reporting_broker_commission"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.reporting_broker_commission}
                                        onChange={(e) => setData('reporting_broker_commission', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="fees">Fees</Label>
                                    <Input
                                        id="fees"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.fees}
                                        onChange={(e) => setData('fees', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="taxes">Taxes</Label>
                                    <Input
                                        id="taxes"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.taxes}
                                        onChange={(e) => setData('taxes', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="discount">Discount</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={data.discount}
                                        onChange={(e) => setData('discount', e.target.value)}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Items</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {data.items.length === 0 && (
                                <p className="text-sm text-muted-foreground">No items added yet. Click &quot;Add Item&quot; to add coverage items.</p>
                            )}

                            {data.items.map((item, index) => (
                                <div key={index} className="space-y-4 rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Item #{index + 1}</span>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <Label>Category</Label>
                                            <Select
                                                value={item.item_type}
                                                onValueChange={(value) => handleItemChange(index, 'item_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="general">General</SelectItem>
                                                    <SelectItem value="property">Property</SelectItem>
                                                    <SelectItem value="liability">Liability</SelectItem>
                                                    <SelectItem value="marine">Marine</SelectItem>
                                                    <SelectItem value="engineering">Engineering</SelectItem>
                                                    <SelectItem value="motor">Motor</SelectItem>
                                                    <SelectItem value="aviation">Aviation</SelectItem>
                                                    <SelectItem value="energy">Energy</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Description</Label>
                                            <Input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                placeholder="Item description"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                                        <div>
                                            <Label>Sum Insured *</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min={0}
                                                value={item.sum_insured}
                                                onChange={(e) => handleItemChange(index, 'sum_insured', e.target.value)}
                                                placeholder="0.00"
                                            />
                                        </div>

                                        <div>
                                            <Label>Rate</Label>
                                            <Input
                                                type="number"
                                                step="0.0001"
                                                min={0}
                                                value={item.rate}
                                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                                placeholder="0.0000"
                                            />
                                        </div>

                                        <div>
                                            <Label>Rate Basis</Label>
                                            <Select
                                                value={item.rate_basis}
                                                onValueChange={(value) => handleItemChange(index, 'rate_basis', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rateBasisOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label>Premium (auto)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={item.premium}
                                                readOnly
                                                className="bg-gray-50"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Clauses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {clauseLibrary.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No clauses available in the library.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {clauseLibrary.map((clause) => (
                                        <label
                                            key={clause.id}
                                            className="flex cursor-pointer items-start space-x-3 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                                        >
                                            <Checkbox
                                                checked={isClauseSelected(clause)}
                                                onCheckedChange={() => toggleClause(clause)}
                                                className="mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium">{clause.title}</span>
                                                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                                        {clause.clause_type}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{clause.content}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {errors.clauses && <p className="mt-1 text-sm text-red-600">{errors.clauses}</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Additional Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Any additional notes for this broker slip..."
                                rows={3}
                            />
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Link href={route('broker-slips.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Broker Slip'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
