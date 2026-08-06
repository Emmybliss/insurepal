import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Policy } from '@/types';
import { Check, ChevronsUpDown, FilePlus, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PolicyNumberSearchSelectProps {
    policyIdValue?: string | number;
    policyNumberValue?: string;
    customerId?: string | number;
    onPolicySelect: (policyId: string, policyNumber: string, policy?: Policy) => void;
    initialPolicies?: Policy[];
    disabled?: boolean;
}

const DEFAULT_EMPTY_POLICIES: Policy[] = [];

export function PolicyNumberSearchSelect({
    policyIdValue,
    policyNumberValue,
    customerId,
    onPolicySelect,
    initialPolicies = DEFAULT_EMPTY_POLICIES,
    disabled = false,
}: PolicyNumberSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);

    // Only populate policies belonging to the selected customer
    useEffect(() => {
        if (!customerId) {
            setPolicies((prev) => (prev.length === 0 ? prev : []));
            setSelectedPolicy((prev) => (prev === null ? prev : null));
            return;
        }

        if (initialPolicies && initialPolicies.length > 0) {
            const filtered = initialPolicies.filter((p) => p.customer_id?.toString() === customerId.toString());
            setPolicies((prev) => {
                const prevIds = prev.map((p) => p.id).join(',');
                const nextIds = filtered.map((p) => p.id).join(',');
                return prevIds === nextIds ? prev : filtered;
            });
        } else {
            setPolicies((prev) => (prev.length === 0 ? prev : []));
        }
    }, [initialPolicies, customerId]);

    // Find selected policy object
    useEffect(() => {
        if (policyIdValue && customerId) {
            const found = policies.find((p) => p.id.toString() === policyIdValue.toString());
            if (found) {
                setSelectedPolicy((prev) => (prev?.id === found.id ? prev : found));
            }
        } else {
            setSelectedPolicy((prev) => (prev === null ? prev : null));
        }
    }, [policyIdValue, policies, customerId]);

    // Debounced search backend call (strictly scoped to customerId)
    useEffect(() => {
        if (!open || !customerId) return;

        const timer = setTimeout(() => {
            setLoading(true);
            fetch(`/api/policies-lookup/search?query=${encodeURIComponent(query)}&customer_id=${customerId}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    setPolicies(data);
                })
                .catch((err) => console.error('Failed to search policies:', err))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, customerId, open]);

    const handleSelectPolicy = (policy: Policy) => {
        setSelectedPolicy(policy);
        const pNum = policy.policy_number || policy.internal_reference || '';
        onPolicySelect(policy.id.toString(), pNum, policy);
        setOpen(false);
        setQuery('');
    };

    const handleCustomPolicyNumber = (customNum: string) => {
        setSelectedPolicy(null);
        onPolicySelect('', customNum.trim());
        setOpen(false);
        setQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedPolicy(null);
        onPolicySelect('', '');
    };

    const isFieldDisabled = disabled || !customerId;

    const displayLabel = () => {
        if (!customerId) {
            return 'Select a customer first...';
        }
        if (selectedPolicy) {
            const pNum = selectedPolicy.policy_number || 'TBA';
            const refNum = selectedPolicy.internal_reference ? ` (${selectedPolicy.internal_reference})` : '';
            return `${pNum}${refNum}`;
        }
        if (policyNumberValue) {
            return `${policyNumberValue} (New Draft Policy)`;
        }
        return 'Search Policy # / Ref # or leave blank for TBA...';
    };

    return (
        <div className="space-y-1">
            <Popover open={open && !!customerId} onOpenChange={(val) => customerId && setOpen(val)}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={isFieldDisabled}
                        className="w-full justify-between font-normal"
                    >
                        <span className={cn('truncate', (!selectedPolicy && !policyNumberValue) || !customerId ? 'text-muted-foreground' : '')}>
                            {displayLabel()}
                        </span>
                        <div className="flex items-center gap-1">
                            {(selectedPolicy || policyNumberValue) && (
                                <X
                                    className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                                    onClick={handleClear}
                                />
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Enter or search Policy Number / Ref #..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {loading && (
                                <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Searching policies...
                                </div>
                            )}

                            {!loading && query.trim() !== '' && (
                                <div className="p-2 border-b bg-muted/40">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="w-full justify-start text-xs font-normal"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleCustomPolicyNumber(query);
                                        }}
                                        onClick={() => handleCustomPolicyNumber(query)}
                                    >
                                        <FilePlus className="mr-2 h-4 w-4 text-primary" />
                                        No policy found. Continue with policy number "{query}"?
                                    </Button>
                                </div>
                            )}

                            {!loading && policies.length === 0 && query.trim() === '' && (
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    No policies found for this customer. Type a policy number to auto-create a draft, or leave blank for TBA.
                                </div>
                            )}

                            {!loading && policies.length > 0 && (
                                <CommandGroup heading="Existing Customer Policies">
                                    {policies.map((policy) => {
                                        const isSelected = selectedPolicy?.id.toString() === policy.id.toString();
                                        const pNum = policy.policy_number || 'TBA';
                                        return (
                                            <div
                                                key={policy.id}
                                                role="button"
                                                tabIndex={0}
                                                className={cn(
                                                    'flex items-center justify-between cursor-pointer py-2 px-3 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground select-none transition-colors',
                                                    isSelected && 'bg-accent/60 font-medium text-accent-foreground'
                                                )}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSelectPolicy(policy);
                                                }}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSelectPolicy(policy);
                                                }}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{pNum}</span>
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-secondary capitalize">
                                                            {policy.status}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        Ref: {policy.internal_reference || 'N/A'} • Product:{' '}
                                                        {policy.policy_product?.name || 'Standard'}
                                                    </span>
                                                </div>
                                                <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                            </div>
                                        );
                                    })}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
                Select an existing policy or enter a new policy number. If left blank, it will default to "TBA" and create a draft policy.
            </p>
        </div>
    );
}

export default PolicyNumberSearchSelect;
