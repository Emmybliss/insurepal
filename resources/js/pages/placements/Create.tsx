import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import AppLayout from '@/layouts/app-layout';
import { Customer, PolicyProduct } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Plus, PlusCircle, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface MarketEntry {
    insurance_company_id: number | string;
    participation_percentage: string;
    status: string;
    response_notes: string;
}

interface PlacementFormData {
    customer_id: number | string;
    insured_id: number | string;
    policy_product_id: number | string;
    total_sum_insured: string;
    currency: string;
    proposed_start_date: string;
    proposed_end_date: string;
    notes: string;
    markets: MarketEntry[];
}

interface Props {
    customers: Customer[];
    policyProducts: PolicyProduct[];
}

export default function Create({ customers, policyProducts }: Props) {
    const [customerList, setCustomerList] = useState<Customer[]>(customers);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [insuredModalOpen, setInsuredModalOpen] = useState(false);
    const [companyNames, setCompanyNames] = useState<Record<number, string>>({});
    const { data, setData, post, processing, errors } = useForm<PlacementFormData>({
        customer_id: '',
        insured_id: '',
        policy_product_id: '',
        total_sum_insured: '',
        currency: 'NGN',
        proposed_start_date: '',
        proposed_end_date: '',
        notes: '',
        markets: [] as MarketEntry[],
    });

    const addMarket = () => {
        setData('markets', [
            ...data.markets,
            { insurance_company_id: '', participation_percentage: '', status: 'pending', response_notes: '' },
        ]);
    };

    const removeMarket = (index: number) => {
        setData('markets', data.markets.filter((_, i) => i !== index));
        setCompanyNames((prev) => {
            const next: Record<number, string> = {};
            Object.entries(prev).forEach(([key, value]) => {
                const k = Number(key);
                if (k < index) next[k] = value;
                else if (k > index) next[k - 1] = value;
            });
            return next;
        });
    };

    const updateMarket = (index: number, field: keyof MarketEntry, value: string) => {
        const updated = [...data.markets];
        updated[index] = { ...updated[index], [field]: value };
        setData('markets', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('placements.store'), {
            onSuccess: () => {
                toast.success('Placement created successfully');
            },
            onError: () => {
                toast.error('Failed to create placement');
            },
        });
    };

    const getCustomerDisplayName = (customer: Customer) => {
        if (customer.type === 'corporate') {
            return customer.company_name || `${customer.first_name} ${customer.last_name}`;
        }
        return `${customer.first_name} ${customer.last_name}`;
    };

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomerList((prev) => [...prev, newCustomer]);
        setData('customer_id', newCustomer.id.toString());
    };

    const handleInsuredCreated = (newCustomer: Customer) => {
        setCustomerList((prev) => [...prev, newCustomer]);
        setData('insured_id', newCustomer.id.toString());
    };

    return (
        <AppLayout>
            <Head title="Create Placement" />
            <div className="space-y-6">
                <div className="mb-8">
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Create Placement</h1>
                        <p className="text-muted-foreground">Create a new insurance placement to submit to market.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Placement Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Customer *</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select value={data.customer_id.toString()} onValueChange={(value) => setData('customer_id', value)}>
                                                <SelectTrigger className={errors.customer_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customerList.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {getCustomerDisplayName(customer)}
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
                                    <Label>Insured (optional)</Label>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Select
                                                value={data.insured_id?.toString() || "none"}
                                                onValueChange={(value) => setData('insured_id', value === "none" ? "" : value)}
                                            >
                                                <SelectTrigger className={errors.insured_id ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Same as customer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Same as customer</SelectItem>
                                                    {customerList.map((customer) => (
                                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                                            {getCustomerDisplayName(customer)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setInsuredModalOpen(true)} className="shrink-0 self-start mt-0">
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add New
                                        </Button>
                                    </div>
                                    {errors.insured_id && <p className="mt-1 text-sm text-red-600">{errors.insured_id}</p>}
                                    <CustomerCreateModal
                                        open={insuredModalOpen}
                                        onOpenChange={setInsuredModalOpen}
                                        onCustomerCreated={handleInsuredCreated}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Policy Product *</Label>
                                    <Select value={data.policy_product_id.toString()} onValueChange={(value) => setData('policy_product_id', value)}>
                                        <SelectTrigger className={errors.policy_product_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {policyProducts.map((product) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                    {product.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.policy_product_id && <p className="mt-1 text-sm text-red-600">{errors.policy_product_id}</p>}
                                </div>

                                <div>
                                    <Label>Currency</Label>
                                    <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
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

                            <div>
                                <Label htmlFor="total_sum_insured">Total Sum Insured</Label>
                                <Input
                                    id="total_sum_insured"
                                    type="number"
                                    step="0.01"
                                    value={data.total_sum_insured}
                                    onChange={(e) => setData('total_sum_insured', e.target.value)}
                                    className={errors.total_sum_insured ? 'border-red-500' : ''}
                                    placeholder="0.00"
                                />
                                {errors.total_sum_insured && <p className="mt-1 text-sm text-red-600">{errors.total_sum_insured}</p>}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Proposed Start Date *</Label>
                                    <DatePickerSimple
                                        date={data.proposed_start_date ? new Date(data.proposed_start_date) : undefined}
                                        onSelect={(date) => setData('proposed_start_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select start date"
                                    />
                                    {errors.proposed_start_date && <p className="mt-1 text-sm text-red-600">{errors.proposed_start_date}</p>}
                                </div>

                                <div>
                                    <Label>Proposed End Date *</Label>
                                    <DatePickerSimple
                                        date={data.proposed_end_date ? new Date(data.proposed_end_date) : undefined}
                                        onSelect={(date) => setData('proposed_end_date', date ? dayjs(date).format('YYYY-MM-DD') : '')}
                                        placeholder="Select end date"
                                    />
                                    {errors.proposed_end_date && <p className="mt-1 text-sm text-red-600">{errors.proposed_end_date}</p>}
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Additional notes about this placement"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Markets (Insurers)</CardTitle>
                                <Button type="button" variant="outline" size="sm" onClick={addMarket}>
                                    <PlusCircle className="mr-1 h-4 w-4" />
                                    Add Insurer
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.markets.length === 0 ? (
                                <p className="text-sm text-gray-500">Add at least one insurer to submit this placement to market.</p>
                            ) : (
                                <div className="space-y-4">
                                    {data.markets.map((market, index) => (
                                        <div key={index} className="rounded-lg border p-4">
                                            <div className="mb-3 flex items-center justify-between">
                                                <span className="text-sm font-medium">Insurer #{index + 1}</span>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeMarket(index)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                <div>
                                                    <Label>Insurance Company *</Label>
                                                    <CompanySearchCombobox
                                                        companyType="underwriter"
                                                        value={companyNames[index] || ''}
                                                        scope="tenant"
                                                        onSelect={(company) => {
                                                            updateMarket(index, 'insurance_company_id', (company.company_id || company.id).toString());
                                                            setCompanyNames((prev) => ({ ...prev, [index]: company.name }));
                                                        }}
                                                        placeholder="Search insurer..."
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Participation %</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={market.participation_percentage}
                                                        onChange={(e) => updateMarket(index, 'participation_percentage', e.target.value)}
                                                        placeholder="100"
                                                    />
                                                </div>
                                                <div>
                                                    <Label>Status</Label>
                                                    <Select
                                                        value={market.status}
                                                        onValueChange={(value) => updateMarket(index, 'status', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="pending">Pending</SelectItem>
                                                            <SelectItem value="accepted">Accepted</SelectItem>
                                                            <SelectItem value="countered">Counter Offer</SelectItem>
                                                            <SelectItem value="declined">Declined</SelectItem>
                                                            <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <Label>Response Notes</Label>
                                                <Textarea
                                                    value={market.response_notes}
                                                    onChange={(e) => updateMarket(index, 'response_notes', e.target.value)}
                                                    placeholder="Insurer response notes"
                                                    rows={2}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Link href={route('placements.index')}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Placement'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
