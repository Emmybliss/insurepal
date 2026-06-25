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
import { ArrowLeft, Calculator, PlusCircle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Placement {
    id: number;
    placement_number: string;
    customer: {
        id: number;
        type: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
    markets?: Array<{
        id: number;
        insurance_company: {
            id: number;
            name: string;
        };
    }>;
}

interface InsuranceCompany {
    id: number;
    name: string;
}

interface ClauseLibraryItem {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_system: boolean;
}

interface BrokerSlipItemModel {
    id: number;
    item_type: string;
    description: string;
    sum_insured: number;
    rate: number;
    rate_basis: string;
    premium: number;
    sort_order: number;
}

interface BrokerSlipClauseModel {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_standard: boolean;
    sort_order: number;
}

interface BrokerSlipPlacement {
    id: number;
    placement_number: string;
    customer: {
        id: number;
        type: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
}

interface BrokerSlipPlacementMarket {
    id: number;
    insurance_company: {
        id: number;
        name: string;
    };
}

interface BrokerSlip {
    id: number;
    placement_id: number;
    placement_market_id: number | null;
    slip_number: string;
    version: number;
    currency: string;
    sum_insured: number;
    rate: number;
    rate_basis: string;
    gross_premium: number;
    commission_rate: number;
    commission_amount: number;
    co_broker_commission: number;
    reporting_broker_commission: number;
    fees: number;
    taxes: number;
    discount: number;
    net_premium: number;
    period_start: string;
    period_end: string;
    claim_payment_condition: string | null;
    status: string;
    placement: BrokerSlipPlacement;
    placementMarket: BrokerSlipPlacementMarket | null;
    items: BrokerSlipItemModel[];
    clauses: BrokerSlipClauseModel[];
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
    placement_id: string;
    placement_market_id: string;
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
    items: SlipItem[];
    clauses: SlipClause[];
}

interface Props {
    brokerSlip: BrokerSlip;
    placements: Placement[];
    insuranceCompanies: InsuranceCompany[];
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

export default function Edit({ brokerSlip, placements, insuranceCompanies, clauseLibrary }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        placement_id: brokerSlip.placement_id.toString(),
        placement_market_id: brokerSlip.placement_market_id?.toString() || '',
        currency: brokerSlip.currency,
        sum_insured: brokerSlip.sum_insured?.toString() || '',
        rate: brokerSlip.rate?.toString() || '',
        rate_basis: brokerSlip.rate_basis || 'percentage',
        gross_premium: brokerSlip.gross_premium?.toString() || '',
        commission_rate: brokerSlip.commission_rate?.toString() || '',
        commission_amount: brokerSlip.commission_amount?.toString() || '',
        co_broker_commission: brokerSlip.co_broker_commission?.toString() || '',
        reporting_broker_commission: brokerSlip.reporting_broker_commission?.toString() || '',
        fees: brokerSlip.fees?.toString() || '',
        taxes: brokerSlip.taxes?.toString() || '',
        discount: brokerSlip.discount?.toString() || '',
        net_premium: brokerSlip.net_premium?.toString() || '',
        period_start: brokerSlip.period_start,
        period_end: brokerSlip.period_end,
        claim_payment_condition: brokerSlip.claim_payment_condition || '',
        items: brokerSlip.items.map((item) => ({
            description: item.description || '',
            sum_insured: item.sum_insured?.toString() || '',
            rate: item.rate?.toString() || '',
            rate_basis: item.rate_basis || 'percentage',
            premium: item.premium?.toString() || '',
            item_type: item.item_type || 'general',
        })),
        clauses: brokerSlip.clauses.map((clause) => ({
            clause_type: clause.clause_type,
            title: clause.title,
            content: clause.content,
            is_standard: clause.is_standard ?? false,
        })),
    });

    const [filteredCompanies, setFilteredCompanies] = useState<InsuranceCompany[]>(insuranceCompanies);

    useEffect(() => {
        if (data.placement_id) {
            const selected = placements.find((p) => p.id.toString() === data.placement_id);
            if (selected?.markets) {
                const companyIds = selected.markets.map((m) => m.insurance_company.id);
                setFilteredCompanies(insuranceCompanies.filter((c) => companyIds.includes(c.id)));
            } else {
                setFilteredCompanies(insuranceCompanies);
            }
        } else {
            setFilteredCompanies(insuranceCompanies);
        }
    }, [data.placement_id, placements, insuranceCompanies]);

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

    const calculatePremiums = () => {
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
    };

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

        put(route('broker-slips.update', brokerSlip.id), {
            onSuccess: () => {
                toast.success('Broker slip updated successfully');
            },
            onError: () => {
                toast.error('Failed to update broker slip. Please check the form and try again.');
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`Edit Broker Slip: ${brokerSlip.slip_number}`} />

            <div className="space-y-6">
                <div className="mb-8">
                    <div className="mb-4">
                        <Link href={route('broker-slips.show', brokerSlip.id)} className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to Broker Slip Details
                        </Link>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold tracking-tight">Edit Broker Slip</h1>
                        <p className="text-muted-foreground">
                            Update broker slip {brokerSlip.slip_number} (v{brokerSlip.version}).
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Placement & Coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Placement *</Label>
                                    <Select
                                        value={data.placement_id}
                                        onValueChange={(value) => setData('placement_id', value)}
                                        disabled
                                    >
                                        <SelectTrigger className={errors.placement_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select placement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {placements.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.placement_number} — {p.customer?.company_name || `${p.customer?.first_name ?? ''} ${p.customer?.last_name ?? ''}`}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.placement_id && <p className="mt-1 text-sm text-red-600">{errors.placement_id}</p>}
                                </div>

                                <div>
                                    <Label>Insurance Company</Label>
                                    <Select
                                        value={data.placement_market_id}
                                        onValueChange={(value) => setData('placement_market_id', value)}
                                    >
                                        <SelectTrigger className={errors.placement_market_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select insurer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredCompanies.map((company) => (
                                                <SelectItem key={company.id} value={company.id.toString()}>
                                                    {company.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.placement_market_id && <p className="mt-1 text-sm text-red-600">{errors.placement_market_id}</p>}
                                </div>
                            </div>

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
                                        className={`bg-gray-50 ${errors.gross_premium ? 'border-red-500' : ''}`}
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
                                        className="bg-gray-50"
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
                                        className={`bg-gray-50 ${errors.net_premium ? 'border-red-500' : ''}`}
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

                            <div className="flex justify-end">
                                <Button type="button" variant="outline" size="sm" onClick={calculatePremiums}>
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Calculate Premiums
                                </Button>
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
                                <p className="text-sm text-muted-foreground">No items added yet. Click "Add Item" to add coverage items.</p>
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

                    <div className="flex justify-end space-x-4">
                        <Link href={route('broker-slips.show', brokerSlip.id)}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Updating...' : 'Update Broker Slip'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
