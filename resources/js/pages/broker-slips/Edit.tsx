import FinancialSummary from '@/components/broker-slips/FinancialSummary';
import RiskScheduleItem from '@/components/broker-slips/RiskScheduleItem';
import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import CompanySearchCombobox from '@/components/insurance/CompanySearchCombobox';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { DatePickerSimple } from '@/components/ui/date-picker-simple';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { cn, formatAmount } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import dayjs from 'dayjs';
import { Check, ChevronsUpDown, Plus, PlusCircle } from 'lucide-react';
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
    policyProduct?: PolicyProduct;
}

interface InsuranceCompany {
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

interface ClauseLibraryItem {
    id: number;
    clause_type: string;
    title: string;
    content: string;
    is_system: boolean;
}

interface BrokerSlipRiskModel {
    id: number;
    policy_class_id: number | null;
    policy_product_id: number | null;
    description: string;
    coverage_amount: number;
    rate: number;
    rate_basis: string;
    premium: number;
    dynamic_fields: Record<string, any>;
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
    customer_id: number;
    policy_class_id: number | null;
    is_system_generated: boolean;
    customer: {
        id: number;
        type: string;
        first_name: string;
        last_name: string;
        company_name: string;
    };
    policyProduct?: PolicyProduct;
}

interface BrokerSlipPlacementMarket {
    id: number;
    insurance_company_id: number;
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
    period_start: string;
    period_end: string;
    claim_payment_condition: string | null;
    commission_rate: number | string | null;
    fees: number | string | null;
    tax_rate: number | string | null;
    status: string;
    placement: {
        id: number;
        placement_number: string;
        customer_id: number;
        policy_class_id: number | null;
        is_system_generated: boolean;
        customer: {
            id: number;
            type: string;
            first_name: string;
            last_name: string;
            company_name: string;
        };
        policyProduct?: PolicyProduct;
    };
    placement_market: BrokerSlipPlacementMarket | null;
    items?: BrokerSlipRiskModel[];
    risks?: BrokerSlipRiskModel[];
    clauses: BrokerSlipClauseModel[];
}

interface SlipRisk {
    policy_class_id: string;
    policy_product_id: string;
    description: string;
    coverage_amount: string;
    rate: string;
    rate_basis: string;
    premium: string;
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
    customer_id?: string;
    insurance_company_id?: string;
    policy_class_id?: string;
}

interface Props {
    brokerSlip: BrokerSlip;
    placements: Placement[];
    customers: Customer[];
    insuranceCompanies: InsuranceCompany[];
    policyTypes: PolicyType[];
    policyClasses: PolicyClass[];
    policyProducts: PolicyProduct[];
    clauseLibrary: ClauseLibraryItem[];
}

function getCustomerName(customer: Customer): string {
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

export default function Edit({
    brokerSlip,
    placements,
    customers,
    insuranceCompanies,
    policyTypes,
    policyClasses,
    policyProducts,
    clauseLibrary,
}: Props) {
    const isDirect = brokerSlip.placement.is_system_generated ?? false;

    const { data, setData, put, processing, errors } = useForm<FormData>({
        placement_id: brokerSlip.placement_id.toString(),
        placement_market_id: brokerSlip.placement_market_id?.toString() || '',
        currency: brokerSlip.currency,
        period_start: brokerSlip.period_start,
        period_end: brokerSlip.period_end,
        claim_payment_condition: brokerSlip.claim_payment_condition || 'Within two weeks of submission of substantiating documents',
        commission_rate: brokerSlip.commission_rate?.toString() || '',
        fees: brokerSlip.fees?.toString() || '',
        tax_rate: brokerSlip.tax_rate?.toString() || '',
        risks: (brokerSlip.items || brokerSlip.risks || []).map((risk) => ({
            policy_class_id: risk.policy_class_id?.toString() || '',
            policy_product_id: risk.policy_product_id?.toString() || '',
            description: risk.description || '',
            coverage_amount: risk.coverage_amount?.toString() || '',
            rate: risk.rate?.toString() || '',
            rate_basis: risk.rate_basis || 'percentage',
            premium: risk.premium?.toString() || '',
            dynamic_fields: risk.dynamic_fields || {},
        })),
        clauses: brokerSlip.clauses.map((clause) => ({
            clause_type: clause.clause_type,
            title: clause.title,
            content: clause.content,
            is_standard: clause.is_standard ?? false,
        })),
        customer_id: brokerSlip.placement.customer_id?.toString() || '',
        insurance_company_id: brokerSlip.placement_market?.insurance_company_id?.toString() || '',
        policy_class_id: brokerSlip.placement.policy_class_id?.toString() || '',
    });

    const [customerList, setCustomerList] = useState<Customer[]>(customers || []);
    const [customerModalOpen, setCustomerModalOpen] = useState(false);
    const [selectedTypeId, setSelectedTypeId] = useState<string>(brokerSlip.placement.policy_product?.policy_type_id?.toString() || '');
    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [selectedClassId, setSelectedClassId] = useState<string>(
        brokerSlip.placement.policy_class_id?.toString() || brokerSlip.placement.policy_product?.policy_class_id?.toString() || '',
    );
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [selectedCompanyName, setSelectedCompanyName] = useState<string>(brokerSlip.placement_market?.insurance_company?.name || '');
    const [feesFocused, setFeesFocused] = useState(false);

    const currentClassId = isDirect
        ? selectedClassId
        : brokerSlip.placement.policy_class_id?.toString() || brokerSlip.placement.policy_product?.policy_class_id?.toString() || '';
    const selectedPolicyClass = policyClasses.find((c) => c.id.toString() === currentClassId);
    const riskMode: RiskMode = (selectedPolicyClass?.risk_mode as RiskMode) || 'single';

    const filteredClasses = policyClasses.filter((c) => {
        if (c.policy_type_id?.toString() !== selectedTypeId) return false;
        return !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase());
    });

    const handleCustomerCreated = (newCustomer: any) => {
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
        if (riskMode === 'single' && currentClassId && data.risks.length === 0) {
            setData((prev) => ({
                ...prev,
                risks: [createEmptyRisk(currentClassId, '', undefined)],
            }));
        }
    }, [riskMode, currentClassId, data.risks.length, setData]);

    const handleRiskChange = (index: number, updates: Partial<SlipRisk>) => {
        setData((prev) => ({
            ...prev,
            risks: prev.risks.map((risk, i) => (i === index ? { ...risk, ...updates } : risk)),
        }));
    };

    const addRisk = () => {
        setData((prev) => ({
            ...prev,
            risks: [...prev.risks, createEmptyRisk(currentClassId, '', undefined)],
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

        put(route('broker-slips.update', brokerSlip.id), {
            onSuccess: () => {
                toast.success('Broker slip updated successfully');
            },
            onError: (errors) => {
                console.log('Failed to update broker slip', errors);
                toast.error('Failed to update broker slip. Please check the form and try again.');
            },
        });
    };

    const renderRiskSchedule = () => {
        if (!currentClassId) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle>Risk Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">Select a Policy Type and Policy Class to configure risk details.</p>
                    </CardContent>
                </Card>
            );
        }

        const isSingle = riskMode === 'single';

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
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.commission_rate}
                                onChange={(e) => setData((prev) => ({ ...prev, commission_rate: e.target.value }))}
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
                                        setData((prev) => ({ ...prev, fees: raw }));
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
                                step="0.01"
                                min="0"
                                max="100"
                                value={data.tax_rate}
                                onChange={(e) => setData((prev) => ({ ...prev, tax_rate: e.target.value }))}
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
            <Head title={`Edit Broker Slip: ${brokerSlip.slip_number}`} />

            <div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Edit Broker Slip</h1>
                    <p className="text-muted-foreground">
                        Update broker slip {brokerSlip.slip_number} (v{brokerSlip.version}).
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer & Coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isDirect ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Customer / Insured *</Label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Select
                                                    value={data.customer_id}
                                                    onValueChange={(value) => setData((prev) => ({ ...prev, customer_id: value }))}
                                                >
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
                                        {errors.customer_id && <p className="mt-1 text-sm text-red-600">{errors.customer_id}</p>}
                                        <CustomerCreateModal
                                            open={customerModalOpen}
                                            onOpenChange={setCustomerModalOpen}
                                            onCustomerCreated={handleCustomerCreated}
                                        />
                                    </div>

                                    <div>
                                        <Label>Underwriter *</Label>
                                        <CompanySearchCombobox
                                            companyType="underwriter"
                                            value={selectedCompanyName}
                                            scope="tenant"
                                            onSelect={(company) => {
                                                setSelectedCompanyName(company.name);
                                                setData((prev) => ({
                                                    ...prev,
                                                    placement_market_id: (company.company_id || company.id).toString(),
                                                    insurance_company_id: (company.company_id || company.id).toString(),
                                                }));
                                            }}
                                            onClear={() => {
                                                setSelectedCompanyName('');
                                                setData((prev) => ({
                                                    ...prev,
                                                    placement_market_id: '',
                                                    insurance_company_id: '',
                                                }));
                                            }}
                                            placeholder="Search and select insurer..."
                                        />
                                        {errors.insurance_company_id && <p className="mt-1 text-sm text-red-600">{errors.insurance_company_id}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Placement *</Label>
                                        <Select
                                            value={data.placement_id}
                                            onValueChange={(value) => setData((prev) => ({ ...prev, placement_id: value }))}
                                            disabled
                                        >
                                            <SelectTrigger className={errors.placement_id ? 'border-red-500' : ''}>
                                                <SelectValue placeholder="Select placement" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {placements.map((p) => (
                                                    <SelectItem key={p.id} value={p.id.toString()}>
                                                        {p.placement_number} —{' '}
                                                        {p.customer?.company_name || `${p.customer?.first_name ?? ''} ${p.customer?.last_name ?? ''}`}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.placement_id && <p className="mt-1 text-sm text-red-600">{errors.placement_id}</p>}
                                    </div>

                                    <div>
                                        <Label>Insurance Company</Label>
                                        <CompanySearchCombobox
                                            companyType="underwriter"
                                            value={selectedCompanyName}
                                            scope="tenant"
                                            onSelect={(company) => {
                                                setSelectedCompanyName(company.name);
                                                setData((prev) => ({
                                                    ...prev,
                                                    placement_market_id: (company.company_id || company.id).toString(),
                                                    insurance_company_id: (company.company_id || company.id).toString(),
                                                }));
                                            }}
                                            onClear={() => {
                                                setSelectedCompanyName('');
                                                setData((prev) => ({
                                                    ...prev,
                                                    placement_market_id: '',
                                                    insurance_company_id: '',
                                                }));
                                            }}
                                            placeholder="Search and select insurer..."
                                        />
                                        {errors.placement_market_id && <p className="mt-1 text-sm text-red-600">{errors.placement_market_id}</p>}
                                    </div>
                                </div>
                            )}

                            {isDirect ? (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <Label>Policy Type *</Label>
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
                                                                                setData((prev) => ({ ...prev, policy_class_id: '', risks: [] }));
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

                                    <div>
                                        <Label>Policy Class *</Label>
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
                                                        {filteredClasses.length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">No class found.</div>
                                                        ) : (
                                                            <CommandGroup>
                                                                {filteredClasses.map((c) => (
                                                                    <div
                                                                        key={c.id}
                                                                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                                        onClick={() => {
                                                                            setSelectedClassId(c.id.toString());
                                                                            setData((prev) => ({
                                                                                ...prev,
                                                                                policy_class_id: c.id.toString(),
                                                                                risks: [],
                                                                            }));
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
                                </div>
                            ) : (
                                <div className="rounded-lg border bg-muted/30 p-4">
                                    <h4 className="mb-2 text-sm font-semibold">Coverage Details</h4>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
                                        {brokerSlip.placement.policyProduct?.policy_type && (
                                            <div>
                                                <dt className="text-muted-foreground">Policy Type</dt>
                                                <dd className="font-medium">{brokerSlip.placement.policyProduct.policy_type.name}</dd>
                                            </div>
                                        )}
                                        {selectedPolicyClass && (
                                            <div>
                                                <dt className="text-muted-foreground">Policy Class</dt>
                                                <dd className="font-medium">{selectedPolicyClass.name}</dd>
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
                                        onSelect={(date) =>
                                            setData((prev) => ({ ...prev, period_start: date ? dayjs(date).format('YYYY-MM-DD') : '' }))
                                        }
                                        placeholder="Select inception date"
                                    />
                                    {errors.period_start && <p className="mt-1 text-sm text-red-600">{errors.period_start}</p>}
                                </div>

                                <div>
                                    <Label>Expiry Date *</Label>
                                    <DatePickerSimple
                                        date={data.period_end ? new Date(data.period_end) : undefined}
                                        onSelect={(date) =>
                                            setData((prev) => ({ ...prev, period_end: date ? dayjs(date).format('YYYY-MM-DD') : '' }))
                                        }
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
                                onChange={(e) => setData((prev) => ({ ...prev, claim_payment_condition: e.target.value }))}
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
                                            className="hover:bg-gray-55 flex cursor-pointer items-start space-x-3 rounded-lg border p-3 dark:hover:bg-gray-900"
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
