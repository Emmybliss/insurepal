import ImportModal from '@/components/customers/ImportModal';
import { RestrictedAction } from '@/components/subscription/restricted-action';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLang } from '@/hooks/useLang';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { Download, Edit, Eye, FileSpreadsheet, PlusCircle, Search, Trash2, Upload, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    first_name?: string;
    last_name?: string;
    company_name?: string;
    logo?: string | null;
    email: string;
    phone?: string;
    user?: {
        avatar?: string | null;
    };
    is_active: boolean;
    quotes_count?: number;
    policies_count?: number;
    created_at: string;
}

interface Props {
    customers: {
        data: Customer[];
        links: any[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    filters: {
        search?: string;
        type?: string;
    };
}

export default function CustomersIndex({ customers, filters }: Props) {
    console.log(customers);
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [importModalOpen, setImportModalOpen] = useState(false);
    const { t } = useLang();

    const handleSearch = (searchOverride?: string, typeOverride?: string) => {
        router.get(
            route('customers.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search,
                type: typeOverride !== undefined ? typeOverride : type || undefined,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setType('');
        router.get(route('customers.index'));
    };

    const getCustomerName = (customer: Customer): string => {
        if (customer.type === 'corporate') {
            return customer.company_name ?? '';
        }
        return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || '';
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleDelete = (customer: Customer) => {
        if (confirm(t('Are you sure you want to delete this customer?'))) {
            router.delete(route('customers.destroy', customer.id), {
                onSuccess: () => {
                    toast.success(t('{name} has been deleted successfully', { name: getCustomerName(customer) }));
                },
                onError: () => {
                    toast.error(t('Failed to delete customer'));
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title={t('Customers')} />

            <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{t('Customers')}</h2>
                        <p className="text-muted-foreground">{t('Manage your individual and corporate customers')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <RestrictedAction>
                                    <Button variant="outline" className="w-full md:w-auto">
                                        <Download className="mr-2 h-4 w-4" />
                                        {t('Export')}
                                    </Button>
                                </RestrictedAction>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.location.href = route('customers.export.excel').toString()}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    {t('Export All')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => window.location.href = route('customers.export.excel', { search, type: type || undefined }).toString()}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    {t('Export Filtered')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <RestrictedAction>
                            <Button variant="outline" className="w-full md:w-auto" onClick={() => setImportModalOpen(true)}>
                                <Upload className="mr-2 h-4 w-4" />
                                {t('Import')}
                            </Button>
                        </RestrictedAction>

                        <RestrictedAction>
                            <Link href={route('customers.create')}>
                                <Button className="w-full md:w-auto">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    {t('Add Customer')}
                                </Button>
                            </Link>
                        </RestrictedAction>
                    </div>
                </div>

                <Card className="border-none bg-muted/20 shadow-none">
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <SearchInput
                                    placeholder={t('Search by name, email, or company...')}
                                    value={search}
                                    onChange={(val) => {
                                        setSearch(val);
                                        handleSearch(val, type);
                                    }}
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <Select
                                    value={type || 'all'}
                                    onValueChange={(value) => {
                                        const newType = value === 'all' ? '' : value;
                                        setType(newType);
                                        handleSearch(search, newType);
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('Customer Type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">{t('All Types')}</SelectItem>
                                        <SelectItem value="individual">{t('Individual')}</SelectItem>
                                        <SelectItem value="corporate">{t('Corporate')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                {(search || type) && (
                                    <Button variant="ghost" onClick={handleReset} className="px-2">
                                        <X className="mr-2 h-4 w-4" />
                                        {t('Clear Filters')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div className="space-y-1">
                            <CardTitle>{t('All Customers')}</CardTitle>
                            <CardDescription>{t('A list of all customers including their contact info and status.')}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-mono">
                            {customers?.total} {t('Total')}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[60px] pl-6">#</TableHead>
                                        <TableHead className="w-[300px]">{t('Customer')}</TableHead>
                                        <TableHead>{t('Type')}</TableHead>
                                        <TableHead>{t('Status')}</TableHead>
                                        <TableHead>{t('Policies')}</TableHead>
                                        <TableHead>{t('Date Added')}</TableHead>
                                        <TableHead className="pr-6 text-right">{t('Actions')}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.length > 0 ? (
                                        customers.data.map((customer, index) => {
                                            const name = getCustomerName(customer);
                                            const serialNumber = (customers.current_page - 1) * customers.per_page + index + 1;
                                            return (
                                                <TableRow key={customer.id} className="group transition-colors hover:bg-muted/30">
                                                    <TableCell className="pl-6 font-medium text-muted-foreground">{serialNumber}.</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10 border shadow-sm">
                                                                <AvatarImage
                                                                    src={
                                                                        customer.type === 'corporate' && customer.logo
                                                                            ? `/storage/${customer.logo}`
                                                                            : customer.user?.avatar
                                                                              ? `/storage/${customer.user.avatar}`
                                                                              : ''
                                                                    }
                                                                    alt={name}
                                                                />
                                                                <AvatarFallback className="bg-primary/5 text-xs font-semibold text-primary">
                                                                    {getInitials(name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col">
                                                                <span className="leading-tight font-semibold">{name}</span>
                                                                <span className="text-xs text-muted-foreground">{customer.email}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={customer.type === 'corporate' ? 'default' : 'outline'} className="capitalize">
                                                            {customer.type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {customer.is_active === true ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-600">
                                                                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                                                                <span className="text-xs font-medium">Active</span>
                                                            </div>
                                                        ) : customer.is_active === false ? (
                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                                                                <span className="text-xs font-medium">Inactive</span>
                                                            </div>
                                                        ) : (
                                                            <Badge variant="outline" className="capitalize">
                                                                {String(customer.is_active)}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{customer.policies_count || 0}</span>
                                                            <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                                {t('Policies')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-muted-foreground">
                                                            {format(new Date(customer.created_at), 'MMM dd, yyyy')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link href={route('customers.show', customer.id)}>
                                                                <Button variant="outline" size="icon" className="hover:bg-emerald/10 h-8 w-8">
                                                                    <Eye className="h-4 w-4 text-emerald-500" />
                                                                </Button>
                                                            </Link>
                                                            <RestrictedAction showIcon={false}>
                                                                <Link href={route('customers.edit', customer.id)}>
                                                                    <Button variant="ghost" size="icon" className="hover:bg-orange/10 h-8 w-8">
                                                                        <Edit className="h-4 w-4 text-orange-500" />
                                                                    </Button>
                                                                </Link>
                                                            </RestrictedAction>
                                                            <RestrictedAction showIcon={false}>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 hover:bg-destructive/10"
                                                                    onClick={() => handleDelete(customer)}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </RestrictedAction>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-64 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-3">
                                                    <div className="rounded-full bg-muted p-3">
                                                        <Search className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-medium">{t('No customers found')}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {t("Try adjusting your search or filters to find what you're looking for.")}
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" onClick={handleReset}>
                                                        {t('Clear Filters')}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    {customers.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-6 py-4">
                            <p className="text-sm text-muted-foreground">
                                {t('Showing page {current} of {total}', { current: customers.current_page, total: customers.last_page })}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page === 1}
                                    onClick={() =>
                                        router.get(
                                            route('customers.index'),
                                            { ...filters, page: customers.current_page - 1 },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    {t('Previous')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={customers.current_page === customers.last_page}
                                    onClick={() =>
                                        router.get(
                                            route('customers.index'),
                                            { ...filters, page: customers.current_page + 1 },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    {t('Next')}
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
        </AppLayout>
    );
}
