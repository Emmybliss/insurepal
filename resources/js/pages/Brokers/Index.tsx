import { Can } from '@/components/auth/permission-guard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SearchInput } from '@/components/ui/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Building2, DollarSign, Edit, Eye, Filter, MoreHorizontal, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Broker {
    id: number;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    status: string;
    logo?: string;
    primary_contact_name: string;
    policies_count: number;
    quotes_count: number;
    total_premium: number;
    created_at: string;
}

interface BrokerStats {
    total_brokers: number;
    active_brokers: number;
    pending_brokers: number;
    total_commission: number;
}

interface BrokersIndexProps extends PageProps {
    brokers: {
        data: Broker[];
        links: any[];
        meta: any;
    };
    stats: BrokerStats;
    filters: {
        search?: string;
        status: string;
    };
}

export default function BrokersIndex({ brokers, stats, filters }: BrokersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Brokers', href: '#' },
    ];

    const handleSearch = (searchOverride?: string, statusOverride?: string) => {
        router.get(
            route('brokers.index'),
            {
                search: searchOverride !== undefined ? searchOverride : search,
                status: statusOverride !== undefined ? statusOverride : status,
            },
            { preserveState: true, replace: true },
        );
    };

    const getStatusBadge = (brokerStatus: string) => {
        switch (brokerStatus) {
            case 'active':
                return (
                    <Badge variant="outline" className="border-green-300 text-green-700">
                        Active
                    </Badge>
                );
            case 'suspended':
                return <Badge variant="destructive">Suspended</Badge>;
            case 'pending':
                return (
                    <Badge variant="outline" className="border-orange-300 text-orange-700">
                        Pending
                    </Badge>
                );
            default:
                return <Badge variant="outline">{brokerStatus}</Badge>;
        }
    };

    const handleDelete = (broker: Broker) => {
        if (confirm(`Are you sure you want to delete broker "${broker.company_name}"? This action cannot be undone.`)) {
            router.delete(route('brokers.destroy', broker.id), {
                onStart: () => {
                    toast.loading('Deleting broker...', { id: 'delete-broker' });
                },
                onSuccess: () => {
                    toast.success(`Broker "${broker.company_name}" has been deleted successfully`, {
                        id: 'delete-broker',
                        description: 'All associated data has been removed',
                        duration: 4000,
                    });
                },
                onError: (errors) => {
                    const message = errors?.message || 'Failed to delete broker. They may have associated data.';
                    toast.error(message, {
                        id: 'delete-broker',
                        description: 'Please try again or contact support',
                        duration: 5000,
                    });
                },
            });
        }
    };

    const handleToggleStatus = (broker: Broker) => {
        const action = broker.status === 'active' ? 'suspend' : 'activate';
        const statusText = broker.status === 'active' ? 'suspended' : 'activated';

        if (confirm(`Are you sure you want to ${action} broker "${broker.company_name}"?`)) {
            router.post(
                route('brokers.toggle-status', broker.id),
                {},
                {
                    onStart: () => {
                        toast.loading(`${action.charAt(0).toUpperCase() + action.slice(1)}ing broker...`, {
                            id: 'toggle-broker-status',
                        });
                    },
                    onSuccess: () => {
                        toast.success(`Broker "${broker.company_name}" has been ${statusText} successfully`, {
                            id: 'toggle-broker-status',
                            description: `Status updated to ${broker.status === 'active' ? 'suspended' : 'active'}`,
                            duration: 4000,
                        });
                    },
                    onError: (errors) => {
                        const message = errors?.message || `Failed to ${action} broker`;
                        toast.error(message, {
                            id: 'toggle-broker-status',
                            description: 'Please try again or contact support',
                            duration: 5000,
                        });
                    },
                },
            );
        }
    };

    return (
        <>
            <Head title="Broker Management" />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Broker Management</h1>
                            <p className="text-muted-foreground">Manage and monitor your broker network</p>
                        </div>

                        <Can permission="create_brokers">
                            <Link href={route('brokers.create')}>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Broker
                                </Button>
                            </Link>
                        </Can>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Brokers</CardTitle>
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_brokers}</div>
                                <p className="text-xs text-muted-foreground">Registered brokers</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Brokers</CardTitle>
                                <Users className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">{stats.active_brokers}</div>
                                <p className="text-xs text-muted-foreground">Currently active</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">{stats.pending_brokers}</div>
                                <p className="text-xs text-muted-foreground">Awaiting activation</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Commission</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">₦{stats.total_commission.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">Commission earned</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Filter Brokers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="w-full flex-1">
                                    <SearchInput
                                        placeholder="Search by company name, email, or phone..."
                                        value={search}
                                        onChange={(val) => {
                                            setSearch(val);
                                            handleSearch(val, status);
                                        }}
                                    />
                                </div>
                                <Select
                                    value={status}
                                    onValueChange={(val) => {
                                        setStatus(val);
                                        handleSearch(search, val);
                                    }}
                                >
                                    <SelectTrigger className="w-48">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Brokers List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Brokers</CardTitle>
                            <CardDescription>Manage your broker network and monitor their performance</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {brokers.data.length > 0 ? (
                                <div className="rounded-md">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px] pl-6">#</TableHead>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Contact</TableHead>
                                                <TableHead>Location</TableHead>
                                                <TableHead>Stats</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="pr-6 text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {brokers.data.map((broker, index) => {
                                                const serialNumber = brokers.meta?.current_page
                                                    ? (brokers.meta.current_page - 1) * brokers.meta.per_page + index + 1
                                                    : index + 1;
                                                return (
                                                    <TableRow key={broker.id} className="group transition-colors hover:bg-muted/30">
                                                        <TableCell className="pl-6 font-medium text-muted-foreground">{serialNumber}.</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border border-muted shadow-sm">
                                                                    <AvatarImage
                                                                        src={broker.logo ? `/storage/${broker.logo}` : ''}
                                                                        alt={broker.company_name}
                                                                    />
                                                                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                                                        {broker.company_name.substring(0, 1).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-semibold">{broker.company_name}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{broker.primary_contact_name}</span>
                                                                <span className="text-xs text-muted-foreground">{broker.contact_email}</span>
                                                                <span className="text-xs text-muted-foreground">{broker.contact_phone}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm">{broker.city}</span>
                                                                <span className="text-xs text-muted-foreground">{broker.state}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">
                                                                    {broker.policies_count}{' '}
                                                                    <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                                                        Policies
                                                                    </span>
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    ₦{broker.total_premium.toLocaleString()} Premium
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(broker.status)}</TableCell>
                                                        <TableCell className="pr-6 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Can permission="view_brokers">
                                                                    <Link href={route('brokers.show', broker.id)}>
                                                                        <Button variant="outline" size="icon" className="hover:bg-emerald/10 h-8 w-8">
                                                                            <Eye className="h-4 w-4 text-emerald-500" />
                                                                        </Button>
                                                                    </Link>
                                                                </Can>
                                                                <Can permission="edit_brokers">
                                                                    <Link href={route('brokers.edit', broker.id)}>
                                                                        <Button variant="ghost" size="icon" className="hover:bg-orange/10 h-8 w-8">
                                                                            <Edit className="h-4 w-4 text-orange-500" />
                                                                        </Button>
                                                                    </Link>
                                                                </Can>
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                            <MoreHorizontal className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <Can permission="edit_brokers">
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleToggleStatus(broker)}
                                                                                className={
                                                                                    broker.status === 'active' ? 'text-yellow-600' : 'text-green-600'
                                                                                }
                                                                            >
                                                                                <Edit className="mr-2 h-4 w-4" />
                                                                                {broker.status === 'active' ? 'Suspend' : 'Activate'}
                                                                            </DropdownMenuItem>
                                                                        </Can>
                                                                        <Can permission="delete_brokers">
                                                                            <DropdownMenuItem
                                                                                onClick={() => handleDelete(broker)}
                                                                                className="text-red-600 focus:text-red-600"
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                                Delete
                                                                            </DropdownMenuItem>
                                                                        </Can>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <h3 className="mt-2 text-sm font-semibold text-gray-900">No brokers found</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {filters.search || filters.status !== 'all'
                                            ? 'No brokers matching the current filter criteria.'
                                            : 'Get started by creating your first broker.'}
                                    </p>
                                    <Can permission="create_brokers">
                                        <div className="mt-6">
                                            <Link href={route('brokers.create')}>
                                                <Button>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Add New Broker
                                                </Button>
                                            </Link>
                                        </div>
                                    </Can>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination */}
                    {brokers?.meta?.links?.length > 3 && (
                        <div className="flex justify-center">
                            <div className="flex gap-1">
                                {brokers.meta.links.map((link: any, index: number) => (
                                    <Button
                                        key={index}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url)}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </AppLayout>
        </>
    );
}
