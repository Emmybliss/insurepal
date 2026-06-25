import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';
import { Building2, ChevronsUpDown, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface BranchInfo {
    id: number | string;
    name: string;
}

export interface InsuranceCompany {
    id: number | string;
    source: 'registry' | 'tenant' | 'manual';
    name: string;
    company_id?: number | string;
    company_name?: string;
    branch?: BranchInfo | null;
    has_branches?: boolean;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    website?: string;
    naicom_reg_number?: string;
    ncrib_reg_number?: string;
    rc_number?: string;
}

interface Props {
    companyType: 'broker' | 'underwriter' | 'all';
    value: string;
    onSelect: (company: InsuranceCompany) => void;
    onClear?: () => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    scope?: 'tenant' | 'registry' | 'all';
}

export default function CompanySearchCombobox({
    companyType,
    value,
    onSelect,
    onClear,
    placeholder = 'Search company name...',
    disabled = false,
    className,
    scope = 'tenant',
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<InsuranceCompany[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const getEndpoint = useCallback(() => {
        if (scope === 'tenant') {
            return `/settings/insurance-companies`;
        }
        if (scope === 'registry') {
            return `/settings/insurance-companies/registry?type=${companyType}`;
        }
        return `/insurance-companies/search?type=${companyType}`;
    }, [scope, companyType]);

    const fetchCompanies = useCallback(
        debounce(async (searchTerm: string) => {
            if (scope === 'tenant' && searchTerm.length < 1) {
                setIsLoading(true);
                try {
                    const response = await fetch(getEndpoint());
                    if (response.ok) {
                        const data = await response.json();
                        setResults(data);
                    }
                } catch (error) {
                    console.error('Error fetching companies:', error);
                } finally {
                    setIsLoading(false);
                }
                return;
            }

            if (searchTerm.length < 2 && scope !== 'tenant') {
                setResults([]);
                return;
            }

            setIsLoading(true);
            try {
                const url =
                    scope === 'tenant'
                        ? `${getEndpoint()}`
                        : `${getEndpoint()}&q=${encodeURIComponent(searchTerm)}`;
                const response = await fetch(
                    scope === 'tenant'
                        ? getEndpoint()
                        : `${getEndpoint()}&q=${encodeURIComponent(searchTerm)}`,
                );
                if (response.ok) {
                    const data = await response.json();
                    if (scope === 'tenant' && searchTerm.length >= 1) {
                        const q = searchTerm.toLowerCase();
                        setResults(
                            data.filter(
                                (item: InsuranceCompany) =>
                                    item.name.toLowerCase().includes(q) ||
                                    item.company_name?.toLowerCase().includes(q),
                            ),
                        );
                    } else {
                        setResults(data);
                    }
                }
            } catch (error) {
                console.error('Error fetching companies:', error);
            } finally {
                setIsLoading(false);
            }
        }, 300),
        [scope, companyType, getEndpoint],
    );

    useEffect(() => {
        if (scope === 'tenant') {
            fetchCompanies(query);
        } else if (query) {
            fetchCompanies(query);
        } else {
            setResults([]);
        }
    }, [query, fetchCompanies, scope]);

    const handleOpenChange = (open: boolean) => {
        setOpen(open);
        if (open && scope === 'tenant' && results.length === 0) {
            fetchCompanies('');
        }
    };

    return (
        <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                    disabled={disabled}
                >
                    <div className="flex items-center gap-2 truncate">
                        <Building2 className="h-4 w-4 shrink-0 opacity-50" />
                        {value || placeholder}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={scope === 'tenant' ? 'Search your companies...' : 'Type to search...'}
                        onValueChange={setQuery}
                        value={query}
                    />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">
                                    {scope === 'tenant' ? 'Loading...' : 'Searching...'}
                                </span>
                            </div>
                        )}

                        {!isLoading && results.length === 0 && scope !== 'tenant' && query.length >= 2 && (
                            <CommandEmpty>
                                <div className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">No matches found.</p>
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-2 h-auto p-0"
                                        onClick={() => {
                                            onSelect({
                                                id: '',
                                                name: query,
                                                source: 'manual',
                                            });
                                            setOpen(false);
                                        }}
                                    >
                                        Use &quot;{query}&quot; as manual entry
                                    </Button>
                                </div>
                            </CommandEmpty>
                        )}

                        {!isLoading && results.length === 0 && scope === 'tenant' && (
                            <CommandEmpty>
                                <div className="p-4 text-center">
                                    <p className="text-sm text-muted-foreground">
                                        No companies found
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Add companies in Settings &gt; Insurance Companies
                                    </p>
                                </div>
                            </CommandEmpty>
                        )}

                        {!isLoading && query.length < 2 && scope !== 'tenant' && !value && (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                Start typing to search the{' '}
                                {companyType === 'all' ? 'registry' : companyType + ' registry'}
                                ...
                            </div>
                        )}

                        <CommandGroup>
                            {results.map((company) => (
                                <div
                                    key={`${company.source}-${company.id}`}
                                    className="flex items-center justify-between cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                    onClick={() => {
                                        onSelect(company);
                                        setOpen(false);
                                        setQuery('');
                                    }}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium">
                                            {company.branch && company.company_name
                                                ? `${company.company_name} — ${company.branch.name}`
                                                : company.name}
                                        </span>
                                        {company.company_name && !company.branch && (
                                            <span className="text-xs text-muted-foreground">
                                                {company.company_name}
                                            </span>
                                        )}
                                        {company.rc_number && (
                                            <span className="text-xs text-muted-foreground">
                                                RC: {company.rc_number}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {company.branch && (
                                            <Badge variant="secondary" className="text-[10px]">
                                                {company.branch.name}
                                            </Badge>
                                        )}
                                        <Badge
                                            variant={
                                                company.source === 'tenant' ? 'secondary' : 'outline'
                                            }
                                            className="ml-1 text-[10px]"
                                        >
                                            {company.source === 'tenant'
                                                ? 'Registered'
                                                : 'Registry'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
