import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatAmount } from '@/lib/utils';
import { Check, ChevronsUpDown, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';

interface RiskData {
    policy_class_id: string;
    policy_product_id: string;
    description: string;
    coverage_amount: string;
    rate: string;
    rate_basis: string;
    premium: string;
    dynamic_fields: Record<string, any>;
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
    code?: string;
    coverage_label?: string;
    default_rate_basis?: string;
    policy_class?: PolicyClass;
    base_premium?: string | number;
}

type RiskMode = 'single' | 'scheduled' | 'mixed';

interface Props {
    index: number;
    risk: RiskData;
    riskMode: RiskMode;
    policyTypes?: PolicyType[];
    policyClasses: PolicyClass[];
    policyProducts: PolicyProduct[];
    onChange: (index: number, updates: Partial<RiskData>) => void;
    onRemove: (index: number) => void;
    errors?: Record<string, string>;
}

const rateBasisOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'per_mille', label: 'Per Mille (‰)' },
    { value: 'fixed', label: 'Fixed Amount' },
];

function calculatePremium(risk: RiskData): string {
    const coverageAmount = parseFloat(risk.coverage_amount) || 0;
    const rate = parseFloat(risk.rate) || 0;

    let premium = 0;
    switch (risk.rate_basis) {
        case 'percentage':
            premium = (coverageAmount * rate) / 100;
            break;
        case 'per_mille':
            premium = (coverageAmount * rate) / 1000;
            break;
        case 'fixed':
            premium = rate;
            break;
    }

    return premium.toFixed(2);
}

export default function RiskScheduleItem({
    index,
    risk,
    riskMode = 'single',
    policyTypes = [],
    policyClasses = [],
    policyProducts = [],
    onChange,
    onRemove,
    errors,
}: Props) {
    const isSingle = riskMode === 'single';
    const isMixed = riskMode === 'mixed';
    const showTypeClass = isMixed;
    const showCardChrome = !isSingle;

    const selectedProduct = policyProducts.find((p) => p.id.toString() === risk.policy_product_id);
    const filteredProducts = risk.policy_class_id
        ? policyProducts.filter((p) => p.policy_class?.id?.toString() === risk.policy_class_id)
        : policyProducts;
    const coverageLabel = selectedProduct?.coverage_label || 'Coverage Amount';

    const selectedClass = policyClasses.find((c) => c.id.toString() === risk.policy_class_id);
    const [selectedTypeId, setSelectedTypeId] = useState<string>(selectedClass?.policy_type_id?.toString() || '');

    const [typeSearchOpen, setTypeSearchOpen] = useState(false);
    const [typeSearchQuery, setTypeSearchQuery] = useState('');
    const [classSearchOpen, setClassSearchOpen] = useState(false);
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [productSearchOpen, setProductSearchOpen] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState('');
    const [coverageAmountFocused, setCoverageAmountFocused] = useState(false);

    const handleFieldChange = (field: string, value: any) => {
        if (field === 'policy_product_id') {
            const product = policyProducts.find((p) => p.id.toString() === value);
            if (product) {
                const updates: Partial<RiskData> = {
                    policy_product_id: value,
                };
                if (product.base_premium) {
                    updates.rate = product.base_premium.toString();
                }
                if (product.default_rate_basis) {
                    updates.rate_basis = product.default_rate_basis;
                }
                const updated = { ...risk, ...updates };
                const premiumStr = calculatePremium(updated);
                updates.premium = premiumStr;

                onChange(index, updates);
                return;
            }
        }
        onChange(index, { [field]: value });
    };

    const handleFieldChangeWithPremium = (field: string, value: any) => {
        const updates: Partial<RiskData> = { [field]: value };

        if (field === 'coverage_amount' || field === 'rate' || field === 'rate_basis') {
            const updated = { ...risk, ...updates };
            const premiumStr = calculatePremium(updated);
            updates.premium = premiumStr;
        }

        onChange(index, updates);
    };

    return (
        <div className={`space-y-4 ${showCardChrome ? 'rounded-lg border p-4' : ''}`}>
            {showCardChrome && (
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk #{index + 1}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </div>
            )}

            {showTypeClass && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                        <Label>Policy Type</Label>
                        <Popover
                            open={typeSearchOpen}
                            onOpenChange={(open) => {
                                setTypeSearchOpen(open);
                                if (!open) setTypeSearchQuery('');
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={typeSearchOpen} className="w-full justify-between">
                                    {selectedTypeId ? policyTypes.find((t) => t.id.toString() === selectedTypeId)?.name : 'Select type...'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Search types..." value={typeSearchQuery} onValueChange={setTypeSearchQuery} />
                                    <CommandList>
                                        {policyTypes.filter((t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                                            .length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">No type found.</div>
                                        ) : (
                                            <CommandGroup>
                                                {policyTypes
                                                    .filter((t) => !typeSearchQuery || t.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                                                    .map((t) => (
                                                        <div
                                                            key={t.id}
                                                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                            onClick={() => {
                                                                setSelectedTypeId(t.id.toString());
                                                                handleFieldChange('policy_class_id', '');
                                                                handleFieldChange('policy_product_id', '');
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
                                    {risk.policy_class_id
                                        ? policyClasses.find((c) => c.id.toString() === risk.policy_class_id)?.name
                                        : selectedTypeId
                                          ? 'Select class...'
                                          : 'Select type first'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput placeholder="Search classes..." value={classSearchQuery} onValueChange={setClassSearchQuery} />
                                    <CommandList>
                                        {policyClasses.filter((c) => {
                                            if (c.policy_type_id?.toString() !== selectedTypeId) return false;
                                            return !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase());
                                        }).length === 0 ? (
                                            <div className="py-6 text-center text-sm text-muted-foreground">No class found.</div>
                                        ) : (
                                            <CommandGroup>
                                                {policyClasses
                                                    .filter((c) => {
                                                        if (c.policy_type_id?.toString() !== selectedTypeId) return false;
                                                        return !classSearchQuery || c.name.toLowerCase().includes(classSearchQuery.toLowerCase());
                                                    })
                                                    .map((c) => (
                                                        <div
                                                            key={c.id}
                                                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                                            onClick={() => {
                                                                handleFieldChange('policy_class_id', c.id.toString());
                                                                handleFieldChange('policy_product_id', '');
                                                                setClassSearchOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'h-4 w-4',
                                                                    risk.policy_class_id === c.id.toString() ? 'opacity-100' : 'opacity-0',
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

                    <div className="w-full">
                        <Label>Policy Product*</Label>
                        <ProductCombobox
                            products={filteredProducts}
                            selectedProduct={selectedProduct}
                            searchOpen={productSearchOpen}
                            setSearchOpen={setProductSearchOpen}
                            searchQuery={productSearchQuery}
                            setSearchQuery={setProductSearchQuery}
                            hasClassFilter={!!risk.policy_class_id}
                            onSelect={(productId) => {
                                handleFieldChange('policy_product_id', productId);
                                setProductSearchOpen(false);
                            }}
                            fullWidth
                        />
                    </div>
                </div>
            )}

            {!showTypeClass && (
                <div className="grid grid-cols-1 gap-4">
                    <div className="w-full">
                        <Label>Policy Product *</Label>
                        <ProductCombobox
                            products={filteredProducts}
                            selectedProduct={selectedProduct}
                            searchOpen={productSearchOpen}
                            setSearchOpen={setProductSearchOpen}
                            searchQuery={productSearchQuery}
                            setSearchQuery={setProductSearchQuery}
                            hasClassFilter={!!risk.policy_class_id}
                            onSelect={(productId) => {
                                handleFieldChange('policy_product_id', productId);
                                setProductSearchOpen(false);
                            }}
                            fullWidth
                        />
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-1">
                <div>
                    <Label>Risk Details</Label>
                    <Textarea
                        className="w-full"
                        value={risk.description}
                        onChange={(e) => handleFieldChange('description', e.target.value)}
                        placeholder="Describe the risk being insured"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                    <Label>{coverageLabel} *</Label>
                    <Input
                        type="text"
                        inputMode="decimal"
                        min={0}
                        value={coverageAmountFocused ? risk.coverage_amount : formatAmount(risk.coverage_amount)}
                        onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, '');
                            if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
                                handleFieldChangeWithPremium('coverage_amount', raw);
                            }
                        }}
                        onFocus={() => setCoverageAmountFocused(true)}
                        onBlur={() => setCoverageAmountFocused(false)}
                        placeholder="0.00"
                        className={errors?.[`risks.${index}.coverage_amount`] ? 'border-red-500' : ''}
                    />
                    {errors?.[`risks.${index}.coverage_amount`] && (
                        <p className="mt-1 text-sm text-red-600">{errors[`risks.${index}.coverage_amount`]}</p>
                    )}
                </div>

                <div>
                    <Label>Rate Basis</Label>
                    <Select value={risk.rate_basis} onValueChange={(value) => handleFieldChangeWithPremium('rate_basis', value)}>
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
                    <Label>Rate</Label>
                    <Input
                        type="number"
                        step="0.0001"
                        min={0}
                        value={risk.rate}
                        onChange={(e) => handleFieldChangeWithPremium('rate', e.target.value)}
                        placeholder="0.0000"
                    />
                </div>

                <div>
                    <Label>Premium (auto)</Label>
                    <Input type="text" value={formatAmount(risk.premium)} readOnly placeholder="0.00" />
                </div>
            </div>
        </div>
    );
}

function ProductCombobox({
    products,
    selectedProduct,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    hasClassFilter,
    onSelect,
    fullWidth = false,
}: {
    products: PolicyProduct[];
    selectedProduct: PolicyProduct | undefined;
    searchOpen: boolean;
    setSearchOpen: (open: boolean) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    hasClassFilter: boolean;
    onSelect: (productId: string) => void;
    fullWidth?: boolean;
}) {
    return (
        <Popover
            open={searchOpen}
            onOpenChange={(open) => {
                setSearchOpen(open);
                if (!open) setSearchQuery('');
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={searchOpen}
                    className={cn('w-full justify-between', fullWidth ? '' : '')}
                    disabled={!hasClassFilter && products.length === 0}
                >
                    {selectedProduct ? selectedProduct.name : hasClassFilter ? 'Select product...' : 'Select a class first'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Search products..." value={searchQuery} onValueChange={setSearchQuery} />
                    <CommandList>
                        {products.filter((product) => {
                            if (!searchQuery) return true;
                            const q = searchQuery.toLowerCase();
                            return product.name.toLowerCase().includes(q) || (product.code && product.code.toLowerCase().includes(q));
                        }).length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">No product found.</div>
                        ) : (
                            <CommandGroup>
                                {products
                                    .filter((product) => {
                                        if (!searchQuery) return true;
                                        const q = searchQuery.toLowerCase();
                                        return product.name.toLowerCase().includes(q) || (product.code && product.code.toLowerCase().includes(q));
                                    })
                                    .map((product) => (
                                        <div
                                            key={product.id}
                                            className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                            onClick={() => onSelect(product.id.toString())}
                                        >
                                            <Check className={cn('h-4 w-4', selectedProduct?.id === product.id ? 'opacity-100' : 'opacity-0')} />
                                            {product.name}
                                        </div>
                                    ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
