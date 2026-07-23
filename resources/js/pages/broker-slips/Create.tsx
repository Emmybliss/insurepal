import FinancialSummary from '@/components/broker-slips/FinancialSummary';
import RiskScheduleItem from '@/components/broker-slips/RiskScheduleItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatAmount } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { ExternalLink, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type RiskMode = 'single' | 'scheduled' | 'mixed';

interface BrokerSlipInfo {
    id: number;
    slip_number: string;
    version: number;
    status: string;
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
    policy_type?: PolicyType;
    base_premium?: string | number;
    default_rate_basis?: string;
}

interface PlacementMarket {
    id: number;
    insurance_company: {
        id: number;
        name: string;
    };
    participation_percentage: string | null;
    status: string;
    broker_slips?: BrokerSlipInfo[];
}

interface Placement {
    id: number;
    placement_number: string;
    policy_product_id?: number;
    currency: string;
    proposed_start_date: string;
    proposed_end_date: string;
    total_sum_insured: number | null;
    customer: {
        id: number;
        type: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
    policyProduct?: PolicyProduct;
    markets?: PlacementMarket[];
}

interface ClauseLibraryItem {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_system: boolean;
}

interface SlipRisk {
    policy_class_id: string;
    policy_product_id: string;
    description: string;
    coverage_amount: string;
    rate: string;
    rate_basis: string;
    premium: string;
    commission_rate?: string;
    commission_amount?: string;
    taxes?: string;
    fees?: string;
    dynamic_fields: Record<string, any>;
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
    period_start: string;
    period_end: string;
    claim_payment_condition: string;
    commission_rate: string;
    fees: string;
    tax_rate: string;
    risks: SlipRisk[];
    clauses: SlipClause[];
}

interface Props {
    placement: Placement | null;
    placements: Placement[];
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
    policyProducts: PolicyProduct[];
    clauseLibrary: ClauseLibraryItem[];
}

function getCustomerName(customer: Placement['customer']): string {
    if (customer.type === 'corporate') return customer.company_name;
    return `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();
}

function createEmptyRisk(classId: string, productId: string, product?: PolicyProduct): SlipRisk {
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

export default function Create({ placement, placements, policyTypes, policyClasses, policyProducts, clauseLibrary }: Props) {
    const [selectedPlacement, setSelectedPlacement] = useState<Placement | undefined>(placement ?? undefined);
    const [feesFocused, setFeesFocused] = useState(false);
    const { data, setData, post, processing, errors } = useForm<FormData>({
        placement_id: placement?.id?.toString() || '',
        placement_market_id: placement?.markets?.[0]?.id?.toString() ?? '',
        currency: placement?.currency || 'USD',
        period_start: placement?.proposed_start_date || '',
        period_end: placement?.proposed_end_date || '',
        claim_payment_condition: 'Within two weeks of submission of substantiating documents',
        commission_rate: '',
        fees: '',
        tax_rate: '',
        risks: [] as SlipRisk[],
        clauses: [] as SlipClause[],
    });

    useEffect(() => {
        if (data.placement_id) {
            const selected = placements.find((p) => p.id.toString() === data.placement_id);
            setSelectedPlacement(selected);
            if (selected) {
                const firstMarket = selected.markets?.[0];
                setData((prev) => ({
                    ...prev,
                    currency: selected.currency || prev.currency,
                    period_start: selected.proposed_start_date || prev.period_start,
                    period_end: selected.proposed_end_date || prev.period_end,
                    placement_market_id: firstMarket?.id?.toString() ?? '',
                }));
            }
        }
    }, [data.placement_id, placements, setData]);

    const selectedMarket = selectedPlacement?.markets?.find((m) => m.id.toString() === data.placement_market_id);

    const existingSlip = selectedMarket?.broker_slips?.[0] ?? null;
    const selectedProduct = selectedPlacement?.policyProduct;
    const selectedPolicyClass = selectedProduct?.policy_class;
    const selectedPolicyType = selectedProduct?.policy_type;
    const riskMode: RiskMode = (selectedPolicyClass?.risk_mode as RiskMode) || 'single';

    useEffect(() => {
        if (selectedProduct && selectedPolicyClass) {
            if (riskMode === 'single') {
                setData((prev) => {
                    const risks =
                        prev.risks.length > 0
                            ? [prev.risks[0]]
                            : [createEmptyRisk(selectedPolicyClass.id.toString(), selectedProduct.id.toString(), selectedProduct)];
                    risks[0].policy_class_id = selectedPolicyClass.id.toString();
                    risks[0].policy_product_id = selectedProduct.id.toString();
                    if (selectedProduct.base_premium && !risks[0].rate) {
                        risks[0].rate = selectedProduct.base_premium.toString();
                    }
                    if (selectedProduct.default_rate_basis) {
                        risks[0].rate_basis = selectedProduct.default_rate_basis;
                    }
                    return { ...prev, risks };
                });
            }
        }
    }, [selectedProduct, selectedPolicyClass, riskMode, setData]);

    const handleRiskChange = (index: number, updates: Partial<SlipRisk>) => {
        setData((prev) => ({
            ...prev,
            risks: prev.risks.map((risk, i) => (i === index ? { ...risk, ...updates } : risk)),
        }));
    };

    const addRisk = () => {
        setData((prev) => ({
            ...prev,
            risks: [
                ...prev.risks,
                createEmptyRisk(
                    riskMode === 'mixed' ? '' : selectedPolicyClass?.id?.toString() || '',
                    riskMode === 'mixed' ? '' : selectedProduct?.id?.toString() || '',
                    riskMode === 'mixed' ? undefined : selectedProduct,
                ),
            ],
        }));
    };

    const removeRisk = (index: number) => {
        setData((prev) => ({
            ...prev,
            risks: prev.risks.filter((_, i) => i !== index),
        }));
    };

    const isClauseSelected = (clause: ClauseLibraryItem) => {
        return data.clauses.some((c) => c.title === clause.title && c.content === clause.content);
    };

    const toggleClause = (clause: ClauseLibraryItem) => {
        if (isClauseSelected(clause)) {
            setData((prev) => ({
                ...prev,
                clauses: prev.clauses.filter((c) => !(c.title === clause.title && c.content === clause.content)),
            }));
        } else {
            setData((prev) => ({
                ...prev,
                clauses: [
                    ...prev.clauses,
                    {
                        clause_type: clause.clause_type,
                        title: clause.title,
                        content: clause.content,
                        is_standard: clause.is_system,
                    },
                ],
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        post(route('broker-slips.store'), {
            onSuccess: () => {
                toast.success('Broker slip created successfully');
            },
            onError: () => {
                toast.error('Failed to create broker slip. Please check the form and try again.');
            },
        });
    };

    const renderRiskSchedule = () => {
        const isSingle = riskMode === 'single';

        if (isSingle && data.risks.length === 0) {
            return null;
        }

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{isSingle ? 'Coverage Details' : 'Risk Schedule'}</CardTitle>
                        {!isSingle && (
                            <Button type="button" variant="outline" size="sm" onClick={addRisk}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add Risk
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Currency</Label>
                        <Select value={data.currency} onValueChange={(value) => setData('currency', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="NGN">NGN (₦)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {data.risks.length === 0 && !isSingle && (
                        <p className="text-sm text-muted-foreground">No risks added yet. Click "Add Risk" to add coverage items.</p>
                    )}

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
                            onRemove={isSingle ? () => {} : removeRisk}
                            errors={errors}
                        />
                    ))}

                    {/* Financial Details (Broker Slip Level) */}
                    <div className="grid grid-cols-1 gap-4 border-t pt-4 sm:grid-cols-3">
                        <div>
                            <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                            <Input
                                id="commission_rate"
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                value={data.commission_rate}
                                onChange={(e) => setData('commission_rate', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.commission_rate && <p className="mt-1 text-sm text-red-600">{errors.commission_rate}</p>}
                        </div>
                        <div>
                            <Label htmlFor="fees">Additional Fee</Label>
                            <Input
                                id="fees"
                                type="text"
                                inputMode="decimal"
                                min="0"
                                value={feesFocused ? data.fees : formatAmount(data.fees)}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/,/g, '');
                                    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                        setData('fees', raw);
                                    }
                                }}
                                onFocus={() => setFeesFocused(true)}
                                onBlur={() => setFeesFocused(false)}
                                placeholder="0.00"
                            />
                            {errors.fees && <p className="mt-1 text-sm text-red-600">{errors.fees}</p>}
                        </div>
                        <div>
                            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                            <Input
                                id="tax_rate"
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                value={data.tax_rate}
                                onChange={(e) => setData('tax_rate', e.target.value)}
                                placeholder="0.00"
                            />
                            {errors.tax_rate && <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>}
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
        );
    };

    return (
        <AppLayout>
            <Head title="Create Broker Slip" />

            <div className="space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Create Broker Slip</h1>
                    <p className="text-muted-foreground">Create a new broker slip for submission to market.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Placement *</Label>
                                    <Select
                                        value={data.placement_id}
                                        onValueChange={(value) => setData('placement_id', value)}
                                        disabled={!!placement}
                                    >
                                        <SelectTrigger className={errors.placement_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select placement" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {placements.map((p) => (
                                                <SelectItem key={p.id} value={p.id.toString()}>
                                                    {p.placement_number} — {getCustomerName(p.customer)}
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
                                        disabled={!selectedPlacement?.markets?.length}
                                    >
                                        <SelectTrigger className={errors.placement_market_id ? 'border-red-500' : ''}>
                                            <SelectValue
                                                placeholder={selectedPlacement?.markets?.length ? 'Select insurer' : 'Select a placement first'}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedPlacement?.markets?.map((m) => (
                                                <SelectItem key={m.id} value={m.id.toString()}>
                                                    {m.insurance_company.name}
                                                    {m.participation_percentage ? ` (${m.participation_percentage}%)` : ''}
                                                    {m.status ? ` — ${m.status}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.placement_market_id && <p className="mt-1 text-sm text-red-600">{errors.placement_market_id}</p>}
                                </div>
                            </div>

                            {selectedPlacement && (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Placement Details</h4>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                                        <div>
                                            <dt className="text-muted-foreground">Number</dt>
                                            <dd className="font-medium">{selectedPlacement.placement_number}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Insured</dt>
                                            <dd className="font-medium">{getCustomerName(selectedPlacement.customer)}</dd>
                                        </div>
                                        {selectedPolicyType && (
                                            <div>
                                                <dt className="text-muted-foreground">Policy Type</dt>
                                                <dd className="font-medium">{selectedPolicyType.name}</dd>
                                            </div>
                                        )}
                                        {selectedPolicyClass && (
                                            <div>
                                                <dt className="text-muted-foreground">Policy Class</dt>
                                                <dd className="font-medium">{selectedPolicyClass.name}</dd>
                                            </div>
                                        )}
                                        <div>
                                            <dt className="text-muted-foreground">Inception</dt>
                                            <dd className="font-medium">
                                                {selectedPlacement.proposed_start_date
                                                    ? dayjs(selectedPlacement.proposed_start_date).format('MMM D, YYYY')
                                                    : '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Expiry</dt>
                                            <dd className="font-medium">
                                                {selectedPlacement.proposed_end_date
                                                    ? dayjs(selectedPlacement.proposed_end_date).format('MMM D, YYYY')
                                                    : '-'}
                                            </dd>
                                        </div>
                                        <div>
                                            <dt className="text-muted-foreground">Sum Insured</dt>
                                            <dd className="font-medium">
                                                {selectedPlacement.total_sum_insured
                                                    ? `${selectedPlacement.currency ?? ''} ${Number(selectedPlacement.total_sum_insured).toLocaleString()}`
                                                    : '-'}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            )}

                            {existingSlip && (
                                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-700 dark:bg-yellow-950">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                                A broker slip already exists for this insurer
                                            </p>
                                            <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                                {existingSlip.slip_number} (v{existingSlip.version}) — {existingSlip.status}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={route('broker-slips.show', existingSlip.id)}
                                                className="inline-flex items-center gap-1 text-sm font-medium text-yellow-800 hover:text-yellow-600 dark:text-yellow-200 dark:hover:text-yellow-400"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                View Slip
                                            </Link>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.post(route('broker-slips.create-new-version', existingSlip.id))}
                                            >
                                                Create Revision
                                            </Button>
                                        </div>
                                    </div>
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
                        </CardContent>
                    </Card>

                    {renderRiskSchedule()}

                    <Card>
                        <CardHeader>
                            <CardTitle>Claim Payment Condition</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                id="claim_payment_condition"
                                value={data.claim_payment_condition}
                                onChange={(e) => setData('claim_payment_condition', e.target.value)}
                                placeholder="e.g., 30 days after proof of loss"
                                rows={2}
                            />
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
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{clause.content}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {errors.clauses && <p className="mt-1 text-sm text-red-600">{errors.clauses}</p>}
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
