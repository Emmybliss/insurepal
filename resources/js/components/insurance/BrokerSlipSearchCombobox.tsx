import { Button } from '@/components/ui/button';
import { Command, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import debounce from 'lodash/debounce';
import { ChevronsUpDown, Loader2, Plus, ScrollText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

interface BrokerSlipResult {
    id: number;
    slip_number: string;
}

interface Props {
    value: string;
    onSelect: (slipNumber: string) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
    customerId?: number | string | null;
}

export default function BrokerSlipSearchCombobox({
    value,
    onSelect,
    placeholder = 'Search broker slip number...',
    disabled = false,
    className,
    customerId,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<BrokerSlipResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSlips, setHasSlips] = useState<boolean>(true);
    const [isCheckingSlips, setIsCheckingSlips] = useState(false);

    const fetchSlips = useMemo(
        () =>
            debounce(async (searchTerm: string) => {
                setIsLoading(true);
                try {
                    const params = new URLSearchParams({ per_page: '10' });
                    if (searchTerm) {
                        params.set('search', searchTerm);
                    }
                    if (customerId) {
                        params.set('customer_id', String(customerId));
                    }
                    const url = `/api/v1/broker-slips?${params.toString()}`;
                    const response = await fetch(url);
                    if (response.ok) {
                        const body = await response.json();
                        const slips: BrokerSlipResult[] =
                            body.data?.map((item: { id: number; slip_number: string }) => ({
                                id: item.id,
                                slip_number: item.slip_number,
                            })) ?? [];
                        setResults(slips);
                    }
                } catch (error) {
                    console.error('Error fetching broker slips:', error);
                } finally {
                    setIsLoading(false);
                }
            }, 300),
        [customerId],
    );

    useEffect(() => {
        if (!customerId) {
            setHasSlips(true);
            return;
        }

        const checkSlips = async () => {
            setIsCheckingSlips(true);
            try {
                const params = new URLSearchParams({ per_page: '1' });
                params.set('customer_id', String(customerId));
                const url = `/api/v1/broker-slips?${params.toString()}`;
                const response = await fetch(url);
                if (response.ok) {
                    const body = await response.json();
                    const slips = body.data || [];
                    setHasSlips(slips.length > 0);
                } else {
                    setHasSlips(false);
                }
            } catch (error) {
                console.error('Error checking broker slips:', error);
                setHasSlips(false);
            } finally {
                setIsCheckingSlips(false);
            }
        };

        checkSlips();
    }, [customerId]);

    useEffect(() => {
        if (open && customerId && hasSlips) {
            fetchSlips(query || '');
        } else if (!open) {
            setResults([]);
        }
    }, [query, fetchSlips, customerId, open, hasSlips]);

    if (isCheckingSlips) {
        return (
            <div className="relative">
                <Input disabled placeholder="Checking broker slips..." className={className} />
                <Loader2 className="absolute top-3 right-3 h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!hasSlips) {
        return (
            <Input
                type="text"
                value={value}
                onChange={(e) => onSelect(e.target.value)}
                placeholder="Enter broker slip number manually..."
                disabled={disabled}
                className={className}
            />
        );
    }

    return (
        <Popover
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) {
                    setQuery('');
                    setResults([]);
                }
            }}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground', className)}
                    disabled={disabled || !customerId}
                >
                    <div className="flex items-center gap-2 truncate">
                        <ScrollText className="h-4 w-4 shrink-0 opacity-50" />
                        {value || placeholder}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput placeholder="Type to search broker slips..." onValueChange={setQuery} value={query} />
                    <CommandList>
                        {isLoading && (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                            </div>
                        )}

                        {!isLoading && query.length === 0 && results.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">No broker slips found for this customer.</div>
                        )}

                        {!isLoading && query.length > 0 && !results.some((r) => r.slip_number === query) && (
                            <div
                                className="flex cursor-pointer items-center gap-2 rounded-sm border-b px-2 py-2 text-sm font-medium text-primary hover:bg-accent"
                                onClick={() => {
                                    onSelect(query);
                                    setOpen(false);
                                    setQuery('');
                                }}
                            >
                                <Plus className="h-4 w-4 shrink-0 text-primary" />
                                <span>Use &quot;{query}&quot; as manual entry</span>
                            </div>
                        )}

                        {!isLoading && results.length > 0 && (
                            <CommandGroup>
                                {results.map((slip) => (
                                    <div
                                        key={slip.id}
                                        className="flex cursor-pointer items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent"
                                        onClick={() => {
                                            onSelect(slip.slip_number);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <ScrollText className="h-4 w-4 shrink-0 opacity-50" />
                                            <span className="font-medium">{slip.slip_number}</span>
                                        </div>
                                    </div>
                                ))}
                            </CommandGroup>
                        )}

                        {!isLoading && query.length > 0 && results.length === 0 && (
                            <div className="p-4 text-center text-sm text-muted-foreground">No broker slips found matching &quot;{query}&quot;.</div>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
