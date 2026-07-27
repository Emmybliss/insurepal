import CustomerCreateModal from '@/components/customers/CustomerCreateModal';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Customer } from '@/types';
import { Check, ChevronsUpDown, Loader2, Plus, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CustomerSearchSelectProps {
    value?: string | number;
    onChange: (customerId: string, customer?: Customer) => void;
    initialCustomers?: Customer[];
    disabled?: boolean;
    error?: string;
}

export function CustomerSearchSelect({
    value,
    onChange,
    initialCustomers = [],
    disabled = false,
}: CustomerSearchSelectProps) {
    const [open, setOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Keep initial Customers synced
    useEffect(() => {
        if (initialCustomers.length > 0) {
            setCustomers(initialCustomers);
        }
    }, [initialCustomers]);

    // Find selected customer object when value changes
    useEffect(() => {
        if (value) {
            const found = customers.find((c) => c.id.toString() === value.toString());
            if (found) {
                setSelectedCustomer(found);
            } else {
                fetch(`/api/customers-lookup/search?query=${encodeURIComponent(value.toString())}`)
                    .then((res) => (res.ok ? res.json() : []))
                    .then((data) => {
                        if (Array.isArray(data) && data.length > 0) {
                            const exact = data.find((c) => c.id.toString() === value.toString()) || data[0];
                            setSelectedCustomer(exact);
                            setCustomers((prev) => {
                                const exists = prev.some((c) => c.id.toString() === exact.id.toString());
                                return exists ? prev : [exact, ...prev];
                            });
                        }
                    })
                    .catch(() => {});
            }
        } else {
            setSelectedCustomer(null);
        }
    }, [value]);

    // Debounced search backend call
    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            setLoading(true);
            fetch(`/api/customers-lookup/search?query=${encodeURIComponent(query)}`)
                .then((res) => (res.ok ? res.json() : []))
                .then((data) => {
                    setCustomers(data);
                })
                .catch((err) => console.error('Failed to search customers:', err))
                .finally(() => setLoading(false));
        }, 300);

        return () => clearTimeout(timer);
    }, [query, open]);

    const getDisplayName = (cust: Customer) => {
        if (cust.display_name) return cust.display_name;
        return cust.type === 'corporate'
            ? cust.company_name || 'Corporate Customer'
            : `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || 'Individual Customer';
    };

    const handleSelect = (cust: Customer) => {
        setSelectedCustomer(cust);
        onChange(cust.id.toString(), cust);
        setOpen(false);
        setQuery('');
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCustomer(null);
        onChange('');
    };

    const handleCustomerCreated = (newCustomer: Customer) => {
        setCustomers((prev) => [newCustomer, ...prev]);
        setSelectedCustomer(newCustomer);
        onChange(newCustomer.id.toString(), newCustomer);
        setModalOpen(false);
    };

    return (
        <div className="space-y-1">
            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            disabled={disabled}
                            className="w-full justify-between font-normal"
                        >
                            {selectedCustomer ? (
                                <span className="truncate">
                                    <span className="font-medium">{getDisplayName(selectedCustomer)}</span>
                                    {selectedCustomer.email ? (
                                        <span className="ml-1.5 text-xs text-muted-foreground">({selectedCustomer.email})</span>
                                    ) : selectedCustomer.phone ? (
                                        <span className="ml-1.5 text-xs text-muted-foreground">({selectedCustomer.phone})</span>
                                    ) : null}
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Search customer by name, email, or phone...</span>
                            )}

                            <div className="flex items-center gap-1">
                                {selectedCustomer && (
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
                                placeholder="Search by Name, Email, or Phone..."
                                value={query}
                                onValueChange={setQuery}
                            />
                            <CommandList>
                                {loading && (
                                    <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Searching customers...
                                    </div>
                                )}

                                {!loading && customers.length === 0 && (
                                    <CommandEmpty>
                                        <div className="p-4 text-center space-y-3">
                                            <p className="text-sm text-muted-foreground">Customer not found.</p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="secondary"
                                                className="w-full"
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    setOpen(false);
                                                    setModalOpen(true);
                                                }}
                                                onClick={() => {
                                                    setOpen(false);
                                                    setModalOpen(true);
                                                }}
                                            >
                                                <UserPlus className="mr-2 h-4 w-4" />
                                                Create new customer?
                                            </Button>
                                        </div>
                                    </CommandEmpty>
                                )}

                                {!loading && customers.length > 0 && (
                                    <CommandGroup heading="Customers">
                                        {customers.map((customer) => {
                                            const isSelected = selectedCustomer?.id.toString() === customer.id.toString();
                                            const name = getDisplayName(customer);
                                            return (
                                                <div
                                                    key={customer.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    className={cn(
                                                        'flex items-center justify-between cursor-pointer py-2 px-3 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground select-none transition-colors',
                                                        isSelected && 'bg-accent/60 font-medium text-accent-foreground'
                                                    )}
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleSelect(customer);
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleSelect(customer);
                                                    }}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {[customer.email, customer.phone].filter(Boolean).join(' • ') || 'No contact details'}
                                                        </span>
                                                    </div>
                                                    <Check className={cn('h-4 w-4 shrink-0', isSelected ? 'opacity-100' : 'opacity-0')} />
                                                </div>
                                            );
                                        })}
                                    </CommandGroup>
                                )}
                            </CommandList>

                            <div className="border-t p-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-xs"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setOpen(false);
                                        setModalOpen(true);
                                    }}
                                    onClick={() => {
                                        setOpen(false);
                                        setModalOpen(true);
                                    }}
                                >
                                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                                    Add New Customer
                                </Button>
                            </div>
                        </Command>
                    </PopoverContent>
                </Popover>

                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setModalOpen(true)}
                    title="Create new customer"
                    className="shrink-0"
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <CustomerCreateModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onCustomerCreated={handleCustomerCreated}
            />
        </div>
    );
}

export default CustomerSearchSelect;
