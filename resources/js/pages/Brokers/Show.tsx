import { Can } from '@/components/auth/permission-guard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    CheckCircle,
    Clock,
    Download,
    Edit,
    Eye,
    FileDigit,
    FileSpreadsheet,
    FileText,
    Mail,
    MapPin,
    Phone,
    Power,
    PowerOff,
    Search,
    Shield,
    ShieldCheck,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    roles: Array<{
        id: number;
        name: string;
        label: string;
    }>;
}

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

interface Policy {
    id: number;
    policy_number: string;
    customer: Customer;
    premium_amount: number;
    status: string;
    created_at: string;
}

interface Quote {
    id: number;
    quote_number: string;
    customer: Customer;
    total_amount: number;
    status: string;
    created_at: string;
}

interface Broker {
    id: number;
    company_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    status: string;
    logo?: string;
    users: User[];
    policies: Policy[];
    quotes: Quote[];
    customers: Customer[];
    settings: {
        commission_rate?: number;
        payment_terms?: number;
    };
    kyc?: {
        id: number;
        status: string;
        verified_at?: string;
    } | null;
    created_at: string;
    updated_at: string;
}

interface BrokerStats {
    total_policies: number;
    active_policies: number;
    total_quotes: number;
    pending_quotes: number;
    total_customers: number;
    total_premium: number;
    total_commission: number;
}

interface BrokerShowProps extends PageProps {
    broker: Broker;
    stats: BrokerStats;
    recent_policies: Policy[];
    recent_quotes: Quote[];
}

export default function BrokerShow({ broker, stats }: BrokerShowProps) {
    const [policySearch, setPolicySearch] = useState('');
    const [policyStatus, setPolicyStatus] = useState('');

    const [quoteSearch, setQuoteSearch] = useState('');
    const [quoteStatus, setQuoteStatus] = useState('');

    const [customerSearch, setCustomerSearch] = useState('');

    const filteredPolicies = useMemo(() => {
        if (!broker.policies) return [];
        return broker.policies.filter((p) => {
            const matchesSearch = p.policy_number.toLowerCase().includes(policySearch.toLowerCase());
            const matchesStatus = policyStatus && policyStatus !== 'all' ? p.status === policyStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [broker.policies, policySearch, policyStatus]);

    const filteredQuotes = useMemo(() => {
        if (!broker.quotes) return [];
        return broker.quotes.filter((q) => {
            const matchesSearch = q.quote_number.toLowerCase().includes(quoteSearch.toLowerCase());
            const matchesStatus = quoteStatus && quoteStatus !== 'all' ? q.status === quoteStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [broker.quotes, quoteSearch, quoteStatus]);

    const filteredCustomers = useMemo(() => {
        if (!broker.customers) return [];
        return broker.customers.filter((c) => {
            const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
            return fullName.includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase());
        });
    }, [broker.customers, customerSearch]);

    const policyStats = useMemo(() => {
        const p = broker.policies || [];
        return {
            total: p.length,
            active: p.filter((x) => x.status === 'active').length,
            pending: p.filter((x) => x.status === 'pending_approval' || x.status === 'pending').length,
            expired: p.filter((x) => x.status === 'expired').length,
        };
    }, [broker.policies]);

    const quoteStats = useMemo(() => {
        const q = broker.quotes || [];
        return {
            total: q.length,
            draft: q.filter((x) => x.status === 'draft').length,
            sent: q.filter((x) => x.status === 'sent').length,
            accepted: q.filter((x) => x.status === 'accepted').length,
        };
    }, [broker.quotes]);

    const getStatusClass = (status: string): string => {
        switch (status) {
            case 'active':
            case 'accepted':
            case 'approved':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'pending':
            case 'pending_approval':
            case 'sent':
                return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'expired':
            case 'rejected':
            case 'suspended':
                return 'border-red-500 text-red-700 bg-red-50';
            case 'draft':
                return 'border-slate-400 text-slate-600 bg-slate-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Brokers', href: route('brokers.index') },
        { title: broker.company_name, href: '#' },
    ];

    const getInitials = () => {
        const name = broker.company_name ?? '';
        if (!name.trim()) return 'C';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
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
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleToggleStatus = () => {
        if (confirm(`Are you sure you want to ${broker.status === 'active' ? 'suspend' : 'activate'} this broker?`)) {
            router.post(route('brokers.toggle-status', broker.id));
        }
    };

    const primaryUser = broker.users.find((user) => user.roles.some((role) => role.name === 'broker'));

    return (
        <>
            <Head title={`${broker.company_name} - Broker Details`} />

            <AppLayout breadcrumbs={breadcrumbs}>
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-16 w-16 border border-muted shadow-sm">
                                        <AvatarImage src={broker.logo ? `/storage/${broker.logo}` : ''} alt={broker.company_name} />
                                        <AvatarFallback className="bg-primary text-xl text-primary-foreground">{getInitials()}</AvatarFallback>
                                    </Avatar>
                                    <h1 className="text-3xl font-bold tracking-tight">{broker.company_name}</h1>
                                    <div className="flex items-center gap-2">
                                        {getStatusBadge(broker.status)}
                                        {broker.kyc?.status === 'verified' ? (
                                            <Badge className="gap-1 border-emerald-200 bg-emerald-50 px-2 text-emerald-700">
                                                <ShieldCheck className="h-3.5 w-3.5" /> Verified
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="gap-1 border-amber-200 px-2 text-amber-600">
                                                <Clock className="h-3.5 w-3.5" /> KYC Pending
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <p className="text-muted-foreground">Broker details and performance overview</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href={route('brokers.kyc.show', broker.id)} className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    KYC Verification
                                </Link>
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => (window.location.href = route('brokers.download-pdf', broker.id))}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Export as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => (window.location.href = route('brokers.download-excel', broker.id))}>
                                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                                        Export as Excel
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <Can permission="manage_broker_status">
                                <Button
                                    variant="outline"
                                    onClick={handleToggleStatus}
                                    className={broker.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                                >
                                    {broker.status === 'active' ? (
                                        <>
                                            <PowerOff className="mr-2 h-4 w-4" />
                                            Suspend
                                        </>
                                    ) : (
                                        <>
                                            <Power className="mr-2 h-4 w-4" />
                                            Activate
                                        </>
                                    )}
                                </Button>
                            </Can>
                            <Can permission="edit_brokers">
                                <Link href={route('brokers.edit', broker.id)}>
                                    <Button>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Broker
                                    </Button>
                                </Link>
                            </Can>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="mt-6 w-full space-y-4">
                        <TabsList className="grid h-auto w-full grid-cols-2 rounded-lg bg-muted/80 p-1 shadow-sm backdrop-blur-sm lg:grid-cols-5">
                            <TabsTrigger
                                value="overview"
                                className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Overview
                            </TabsTrigger>
                            <TabsTrigger
                                value="policies"
                                className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Policies
                            </TabsTrigger>
                            <TabsTrigger
                                value="quotes"
                                className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Quotes
                            </TabsTrigger>
                            <TabsTrigger
                                value="customers"
                                className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Customers
                            </TabsTrigger>
                            <TabsTrigger
                                value="team"
                                className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                            >
                                Team
                            </TabsTrigger>
                        </TabsList>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="space-y-6 lg:col-span-2">
                                    <Card className="border-muted/60 shadow-sm">
                                        <CardHeader className="border-b bg-muted/10 pb-4">
                                            <CardTitle className="flex items-center text-lg">
                                                <Building2 className="mr-2 h-5 w-5 text-primary" />
                                                Company Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Email</p>
                                                            <p className="text-sm text-muted-foreground">{broker.contact_email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Phone</p>
                                                            <p className="text-sm text-muted-foreground">{broker.contact_phone}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="mt-1 h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm font-medium">Address</p>
                                                            <div className="text-sm text-muted-foreground">
                                                                {broker.address && <p>{broker.address}</p>}
                                                                <p>
                                                                    {broker.city}, {broker.state} {broker.postal_code}
                                                                </p>
                                                                <p>{broker.country}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Primary Contact */}
                                    {primaryUser && (
                                        <Card className="border-muted/60 shadow-sm">
                                            <CardHeader className="border-b bg-muted/10 pb-4">
                                                <CardTitle className="flex items-center text-lg">
                                                    <User className="mr-2 h-5 w-5 text-primary" />
                                                    Primary Contact
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                                        <User className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{primaryUser.name}</p>
                                                        <p className="text-muted-foreground">{primaryUser.email}</p>
                                                        <div className="mt-1 flex gap-1">
                                                            {primaryUser.roles.map((role) => (
                                                                <Badge key={role.id} variant="secondary" className="text-xs">
                                                                    {role.label}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Business Settings */}
                                    <Card className="border-muted/60 shadow-sm">
                                        <CardHeader className="border-b bg-muted/10 pb-4">
                                            <CardTitle className="text-lg">Business Settings</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div className="rounded-lg border border-muted/60 bg-muted/20 p-4">
                                                    <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                                                        Commission Rate
                                                    </p>
                                                    <p className="mt-1 text-2xl font-bold">{broker.settings?.commission_rate || 10}%</p>
                                                </div>
                                                <div className="rounded-lg border border-muted/60 bg-muted/20 p-4">
                                                    <p className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                                                        Payment Terms
                                                    </p>
                                                    <p className="mt-1 text-2xl font-bold">{broker.settings?.payment_terms || 30} days</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Sidebar Stats */}
                                <div className="space-y-6">
                                    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
                                        <div className="absolute -top-4 -right-4 opacity-5">
                                            <Shield className="h-32 w-32" />
                                        </div>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg font-semibold">Broker Value</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-4xl font-extrabold tracking-tight text-primary">
                                                ₦{stats.total_premium.toLocaleString()}
                                            </div>
                                            <p className="mt-2 text-sm font-medium text-muted-foreground">Total Premium Generated</p>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-muted/60 shadow-sm">
                                        <CardHeader className="border-b bg-muted/10 pb-4">
                                            <CardTitle className="flex items-center text-base">
                                                <FileDigit className="mr-2 h-4 w-4 text-primary" />
                                                Performance Summary
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Total Policies</span>
                                                <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                    {stats.total_policies}
                                                </span>
                                            </div>
                                            <Separator className="opacity-50" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Active Policies</span>
                                                <span className="min-w-[32px] rounded-full bg-emerald-100 px-2.5 py-0.5 text-center font-bold text-emerald-700">
                                                    {stats.active_policies}
                                                </span>
                                            </div>
                                            <Separator className="opacity-50" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Total Quotes</span>
                                                <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                    {stats.total_quotes}
                                                </span>
                                            </div>
                                            <Separator className="opacity-50" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Total Customers</span>
                                                <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                    {stats.total_customers}
                                                </span>
                                            </div>
                                            <Separator className="opacity-50" />
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-muted-foreground">Total Commission</span>
                                                <span className="font-bold text-primary">₦{stats.total_commission.toLocaleString()}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* POLICIES TAB */}
                        <TabsContent value="policies" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card className="shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                                            Total Policies
                                        </CardTitle>
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{policyStats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-green-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-green-700 uppercase">Active</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-700">{policyStats.active}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-yellow-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-yellow-700 uppercase">Pending</CardTitle>
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-700">{policyStats.pending}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-red-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-red-700 uppercase">Expired</CardTitle>
                                        <XCircle className="h-4 w-4 text-red-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-700">{policyStats.expired}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center text-lg">
                                            <Shield className="mr-2 h-5 w-5 text-primary" /> Policies
                                        </CardTitle>
                                        <CardDescription>Track all policies managed by this broker.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="mb-6 flex flex-col gap-4 md:flex-row">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search policy numbers..."
                                                value={policySearch}
                                                onChange={(e) => setPolicySearch(e.target.value)}
                                                className="border-muted-foreground/20 bg-muted/20 pl-9 transition-colors hover:border-primary/50"
                                            />
                                        </div>
                                        <Select value={policyStatus} onValueChange={setPolicyStatus}>
                                            <SelectTrigger className="w-[180px] border-muted-foreground/20 bg-muted/20">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="expired">Expired</SelectItem>
                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-foreground">Policy Number</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Customer</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Premium</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Date Created</TableHead>
                                                    <TableHead className="pr-6 text-right font-semibold text-foreground">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPolicies.length > 0 ? (
                                                    filteredPolicies.map((policy) => (
                                                        <TableRow key={policy.id} className="group transition-colors hover:bg-muted/30">
                                                            <TableCell className="py-4 font-medium">{policy.policy_number}</TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-foreground">
                                                                        {policy.customer.first_name} {policy.customer.last_name}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">{policy.customer.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 font-semibold">
                                                                ₦{policy.premium_amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <Badge
                                                                    variant="outline"
                                                                    className={`border-px capitalize ${getStatusClass(policy.status)}`}
                                                                >
                                                                    {policy.status.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-muted-foreground">
                                                                {new Date(policy.created_at).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="py-4 pr-6 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                    className="transition-all hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Link href={route('policy-management.show', policy.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-40 bg-muted/5 text-center text-muted-foreground italic">
                                                            No policies found matching your selection.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* QUOTES TAB */}
                        <TabsContent value="quotes" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                            <div className="grid gap-4 md:grid-cols-4">
                                <Card className="shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                                            Total Quotes
                                        </CardTitle>
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{quoteStats.total}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-blue-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-blue-700 uppercase">Drafts</CardTitle>
                                        <FileText className="h-4 w-4 text-blue-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-700">{quoteStats.draft}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-yellow-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-yellow-700 uppercase">Sent</CardTitle>
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-yellow-700">{quoteStats.sent}</div>
                                    </CardContent>
                                </Card>
                                <Card className="border-green-200 shadow-sm">
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium tracking-wider text-green-700 uppercase">Accepted</CardTitle>
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-700">{quoteStats.accepted}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center text-lg">
                                            <FileText className="mr-2 h-5 w-5 text-primary" /> Quotes
                                        </CardTitle>
                                        <CardDescription>Review all insurance quotes generated by this broker.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="mb-6 flex flex-col gap-4 md:flex-row">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search quote numbers..."
                                                value={quoteSearch}
                                                onChange={(e) => setQuoteSearch(e.target.value)}
                                                className="border-muted-foreground/20 bg-muted/20 pl-9 transition-colors hover:border-primary/50"
                                            />
                                        </div>
                                        <Select value={quoteStatus} onValueChange={setQuoteStatus}>
                                            <SelectTrigger className="w-[180px] border-muted-foreground/20 bg-muted/20">
                                                <SelectValue placeholder="All Statuses" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Statuses</SelectItem>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="sent">Sent</SelectItem>
                                                <SelectItem value="accepted">Accepted</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-foreground">Quote Number</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Customer</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Amount</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Date Created</TableHead>
                                                    <TableHead className="pr-6 text-right font-semibold text-foreground">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredQuotes.length > 0 ? (
                                                    filteredQuotes.map((quote) => (
                                                        <TableRow key={quote.id} className="transition-colors hover:bg-muted/30">
                                                            <TableCell className="py-4 font-medium">{quote.quote_number}</TableCell>
                                                            <TableCell className="py-4">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-foreground">
                                                                        {quote.customer.first_name} {quote.customer.last_name}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">{quote.customer.email}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 font-semibold">
                                                                ₦{quote.total_amount.toLocaleString()}
                                                            </TableCell>
                                                            <TableCell className="py-4">
                                                                <Badge variant="outline" className={`capitalize ${getStatusClass(quote.status)}`}>
                                                                    {quote.status}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-sm text-muted-foreground">
                                                                {new Date(quote.created_at).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="py-4 pr-6 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                    className="transition-all hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Link href={route('quotes.show', quote.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="h-40 bg-muted/5 text-center text-muted-foreground italic">
                                                            No quotes found matching your selection.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* CUSTOMERS TAB */}
                        <TabsContent value="customers" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center text-lg">
                                            <Users className="mr-2 h-5 w-5 text-primary" /> Registered Customers
                                        </CardTitle>
                                        <CardDescription>A complete list of customers associated with this broker.</CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="secondary" className="px-3 py-1">
                                            {broker.customers.length} Total Customers
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="mb-6">
                                        <div className="relative max-w-md">
                                            <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search by name or email..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                className="border-muted-foreground/20 bg-muted/20 pl-9 transition-colors hover:border-primary/50"
                                            />
                                        </div>
                                    </div>

                                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-foreground">Name</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Email</TableHead>
                                                    <TableHead className="pr-6 text-right font-semibold text-foreground">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCustomers.length > 0 ? (
                                                    filteredCustomers.map((customer) => (
                                                        <TableRow key={customer.id} className="transition-colors hover:bg-muted/30">
                                                            <TableCell className="py-4 font-medium">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                                        {customer.first_name[0]}
                                                                        {customer.last_name[0]}
                                                                    </div>
                                                                    {customer.first_name} {customer.last_name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="py-4 text-muted-foreground">{customer.email}</TableCell>
                                                            <TableCell className="py-4 pr-6 text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    asChild
                                                                    className="transition-all hover:bg-primary/10 hover:text-primary"
                                                                >
                                                                    <Link href={route('customers.show', customer.id)}>
                                                                        <Eye className="mr-2 h-4 w-4" /> Profile
                                                                    </Link>
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={3} className="h-40 bg-muted/5 text-center text-muted-foreground italic">
                                                            No customers found matching your search.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* TEAM TAB */}
                        <TabsContent value="team" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between border-b py-4">
                                    <div className="space-y-1">
                                        <CardTitle className="flex items-center text-lg">
                                            <User className="mr-2 h-5 w-5 text-primary" /> Broker Team
                                        </CardTitle>
                                        <CardDescription>Manage team members and their roles for this broker.</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {broker.users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="group relative flex flex-col overflow-hidden rounded-xl border border-muted/60 bg-card p-5 transition-all hover:shadow-md"
                                            >
                                                <div className="absolute top-0 right-0 -mt-12 -mr-12 h-24 w-24 rounded-bl-full bg-primary/5 transition-all group-hover:bg-primary/10" />
                                                <div className="mb-4 flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                                                        {user.name
                                                            .split(' ')
                                                            .map((n) => n[0])
                                                            .join('')
                                                            .slice(0, 2)
                                                            .toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-lg leading-tight font-bold">{user.name}</p>
                                                        <p className="line-clamp-1 text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-auto flex flex-wrap gap-2">
                                                    {user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            variant="secondary"
                                                            className="px-3 py-0.5 text-[10px] font-bold tracking-wider uppercase"
                                                        >
                                                            {role.label}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </AppLayout>
        </>
    );
}
