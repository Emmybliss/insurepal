import FinancialSummary from '@/components/broker-slips/FinancialSummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

interface PolicyRisk {
    description: string;
    coverage_amount: string;
    rate: string;
    rate_basis: string;
    premium: string;
    dynamic_fields: Record<string, any>;
}

interface Props {
    supportsMultipleRisks: boolean;
    risks: PolicyRisk[];
    onChange: (risks: PolicyRisk[]) => void;
    errors?: Record<string, string>;
    currency?: string;
}

const rateBasisOptions = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'per_mille', label: 'Per Mille (‰)' },
    { value: 'fixed', label: 'Fixed Amount' },
];

function calculatePremium(risk: PolicyRisk): string {
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

export default function RiskScheduleSection({ supportsMultipleRisks, risks, onChange, errors, currency = 'NGN' }: Props) {
    const updateRisk = (index: number, updates: Partial<PolicyRisk>) => {
        const updated = risks.map((risk, i) => {
            if (i !== index) return risk;
            const next = { ...risk, ...updates };
            if (updates.coverage_amount !== undefined || updates.rate !== undefined || updates.rate_basis !== undefined) {
                next.premium = calculatePremium(next);
            }
            return next;
        });
        onChange(updated);
    };

    const addRisk = () => {
        onChange([...risks, { description: '', coverage_amount: '', rate: '', rate_basis: 'percentage', premium: '', dynamic_fields: {} }]);
    };

    const removeRisk = (index: number) => {
        onChange(risks.filter((_, i) => i !== index));
    };

    if (!supportsMultipleRisks) {
        const risk = risks[0] || { description: '', coverage_amount: '', rate: '', rate_basis: 'percentage', premium: '', dynamic_fields: {} };

        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Coverage Details</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                    <div>
                        <Label>Sum Assured (₦) *</Label>
                        <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={risk.coverage_amount}
                            onChange={(e) => updateRisk(0, { coverage_amount: e.target.value })}
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <Label>Rate</Label>
                        <Input
                            type="number"
                            step="0.0001"
                            min={0}
                            value={risk.rate}
                            onChange={(e) => updateRisk(0, { rate: e.target.value })}
                            placeholder="0.0000"
                        />
                    </div>
                    <div>
                        <Label>Rate Basis</Label>
                        <Select value={risk.rate_basis} onValueChange={(value) => updateRisk(0, { rate_basis: value })}>
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
                        <Input type="number" step="0.01" value={risk.premium} readOnly placeholder="0.00" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Risk Schedule</h3>
                <Button type="button" variant="outline" size="sm" onClick={addRisk}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Risk
                </Button>
            </div>

            {risks.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                    No risks added yet. Click "Add Risk" to add coverage items.
                </div>
            )}

            {risks.map((risk, index) => (
                <div key={index} className="space-y-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Risk #{index + 1}</span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeRisk(index)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label>Description</Label>
                            <Input
                                type="text"
                                value={risk.description}
                                onChange={(e) => updateRisk(index, { description: e.target.value })}
                                placeholder="Risk description"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                        <div>
                            <Label>Coverage Amount *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={risk.coverage_amount}
                                onChange={(e) => updateRisk(index, { coverage_amount: e.target.value })}
                                placeholder="0.00"
                                className={errors?.[`risks.${index}.coverage_amount`] ? 'border-red-500' : ''}
                            />
                            {errors?.[`risks.${index}.coverage_amount`] && (
                                <p className="mt-1 text-sm text-red-600">{errors[`risks.${index}.coverage_amount`]}</p>
                            )}
                        </div>

                        <div>
                            <Label>Rate</Label>
                            <Input
                                type="number"
                                step="0.0001"
                                min={0}
                                value={risk.rate}
                                onChange={(e) => updateRisk(index, { rate: e.target.value })}
                                placeholder="0.0000"
                            />
                        </div>

                        <div>
                            <Label>Rate Basis</Label>
                            <Select value={risk.rate_basis} onValueChange={(value) => updateRisk(index, { rate_basis: value })}>
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
                            <Input type="number" step="0.01" value={risk.premium} readOnly placeholder="0.00" />
                        </div>
                    </div>
                </div>
            ))}

            {risks.length > 0 && <FinancialSummary risks={risks} currency={currency} />}
        </div>
    );
}
