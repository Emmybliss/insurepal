import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Head, Link, router } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle,
    Clock,
    Copy,
    Download,
    Edit,
    FileDigit,
    FileSpreadsheet,
    FileText,
    Key,
    Lock,
    Mail,
    MapPin,
    Phone,
    Receipt as ReceiptIcon,
    RotateCcw,
    Search,
    Shield,
    ShieldCheck,
    Trash2,
    User,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Kyc {
    id: number;
    status: string;
    verified_at?: string;
}

interface Customer {
    id: number;
    type: 'individual' | 'corporate';
    kyc?: Kyc | null;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    logo?: string | null;
    email: string;
    phone?: string;
    date_of_birth?: string;
    gender?: string;
    occupation?: string;
    annual_income?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    string: string;
    user_id?: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    user?: {
        id: number;
        name: string;
        email: string;
        login_access: boolean;
        avatar?: string | null;
        created_at: string;
    };
    quotes?: Array<{
        id: number;
        quote_number: string;
        status: string;
        total_amount: string;
        created_at: string;
    }>;
    policies?: Array<{
        id: number;
        policy_number: string;
        status: string;
        approval_status?: string;
        premium_amount: string;
        expiry_date?: string;
        created_at: string;
    }>;
    claims?: Array<{
        id: number;
        claim_reference: string;
        status: string;
        claim_amount: string;
        created_at: string;
    }>;
    invoices?: Array<{
        id: number;
        invoice_number: string;
        status: string;
        total_amount: string;
        created_at: string;
    }>;
    receipts?: Array<{
        id: number;
        receipt_number: string;
        payment_status: string;
        amount_paid: string;
        created_at: string;
    }>;
}

interface Props {
    customer: Customer;
    stats: {
        total_quotes: number;
        total_policies: number;
        active_policies: number;
        total_premium: number;
        total_claims?: number;
        total_invoices?: number;
    };
    credentials?: {
        email: string;
        password: string;
        login_url: string;
    };
}

export default function CustomerShow({ customer, stats, credentials }: Props) {
    console.log('Show', customer);
    const [showCredentials, setShowCredentials] = useState(!!credentials);

    // Filters State for Policies
    const [policySearch, setPolicySearch] = useState('');
    const [policyStatus, setPolicyStatus] = useState('');

    // Filters State for Quotes
    const [quoteSearch, setQuoteSearch] = useState('');
    const [quoteStatus, setQuoteStatus] = useState('');

    // Filters State for Claims
    const [claimSearch, setClaimSearch] = useState('');
    const [claimStatus, setClaimStatus] = useState('');

    // --- Policies Data & Stats ---
    const filteredPolicies = useMemo(() => {
        if (!customer.policies) return [];
        return customer.policies.filter((p) => {
            const matchesSearch = p.policy_number.toLowerCase().includes(policySearch.toLowerCase());
            const matchesStatus = policyStatus && policyStatus !== 'all' ? p.status === policyStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [customer.policies, policySearch, policyStatus]);

    console.log('customer.policies', customer.policies);
    const policyStats = useMemo(() => {
        const p = customer.policies || [];
        const isExpired = (policy: any) => {
            return policy.status === 'expired' || (policy.expiry_date && new Date(policy.expiry_date) < new Date());
        };
        return {
            total: p.length,
            active: p.filter((x) => x.status === 'active' && !isExpired(x)).length,
            pending: p.filter((x) => x.status === 'pending_approval' || x.status === 'pending').length,
            expired: p.filter((x) => isExpired(x)).length,
        };
    }, [customer.policies]);

    // --- Quotes Data & Stats ---
    const filteredQuotes = useMemo(() => {
        if (!customer.quotes) return [];
        return customer.quotes.filter((q) => {
            const matchesSearch = q.quote_number.toLowerCase().includes(quoteSearch.toLowerCase());
            const matchesStatus = quoteStatus && quoteStatus !== 'all' ? q.status === quoteStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [customer.quotes, quoteSearch, quoteStatus]);

    const quoteStats = useMemo(() => {
        const q = customer.quotes || [];
        return {
            total: q.length,
            draft: q.filter((x) => x.status === 'draft').length,
            sent: q.filter((x) => x.status === 'sent').length,
            accepted: q.filter((x) => x.status === 'accepted').length,
        };
    }, [customer.quotes]);

    // --- Claims Data & Stats ---
    const filteredClaims = useMemo(() => {
        if (!customer.claims) return [];
        return customer.claims.filter((c) => {
            const matchesSearch = c.claim_reference.toLowerCase().includes(claimSearch.toLowerCase());
            const matchesStatus = claimStatus && claimStatus !== 'all' ? c.status === claimStatus : true;
            return matchesSearch && matchesStatus;
        });
    }, [customer.claims, claimSearch, claimStatus]);

    const claimStats = useMemo(() => {
        const c = customer.claims || [];
        return {
            total: c.length,
            pending: c.filter((x) => x.status === 'submitted' || x.status === 'under_review').length,
            approved: c.filter((x) => x.status === 'approved').length,
            rejected: c.filter((x) => x.status === 'rejected').length,
        };
    }, [customer.claims]);

    // Badge color helpers
    const getPolicyStatusClass = (status: string, expiry_date?: string): string => {
        const isExpired = status === 'expired' || (expiry_date && new Date(expiry_date) < new Date());
        if (isExpired) return 'border-red-400 text-red-700 bg-red-50';

        switch (status) {
            case 'active':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'approved':
                return 'border-blue-500 text-blue-700 bg-blue-50';
            case 'pending_approval':
            case 'pending':
                return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'cancelled':
                return 'border-gray-400 text-gray-600 bg-gray-50';
            case 'suspended':
                return 'border-orange-400 text-orange-700 bg-orange-50';
            case 'rejected':
                return 'border-red-500 text-red-700 bg-red-50';
            case 'draft':
                return 'border-slate-400 text-slate-600 bg-slate-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    const getQuoteStatusClass = (status: string): string => {
        switch (status) {
            case 'accepted':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'sent':
                return 'border-blue-500 text-blue-700 bg-blue-50';
            case 'draft':
                return 'border-slate-400 text-slate-600 bg-slate-50';
            case 'rejected':
                return 'border-red-500 text-red-700 bg-red-50';
            case 'expired':
                return 'border-orange-400 text-orange-700 bg-orange-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    const getClaimStatusClass = (status: string): string => {
        switch (status) {
            case 'approved':
            case 'settled':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'submitted':
            case 'under_review':
                return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'info_requested':
                return 'border-blue-500 text-blue-700 bg-blue-50';
            case 'rejected':
                return 'border-red-500 text-red-700 bg-red-50';
            case 'closed':
                return 'border-gray-400 text-gray-600 bg-gray-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    const getInvoiceStatusClass = (status: string): string => {
        switch (status) {
            case 'paid':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'pending':
                return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'overdue':
                return 'border-red-500 text-red-700 bg-red-50';
            case 'cancelled':
                return 'border-gray-400 text-gray-600 bg-gray-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    const getReceiptStatusClass = (status: string): string => {
        switch (status) {
            case 'completed':
                return 'border-green-500 text-green-700 bg-green-50';
            case 'pending':
                return 'border-yellow-500 text-yellow-700 bg-yellow-50';
            case 'refunded':
                return 'border-orange-400 text-orange-700 bg-orange-50';
            case 'failed':
                return 'border-red-500 text-red-700 bg-red-50';
            default:
                return 'border-muted text-muted-foreground';
        }
    };

    // Formatters & Handlers
    const getCustomerName = () => {
        return customer.type === 'corporate' ? customer.company_name : `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
    };

    const getInitials = () => {
        const name = getCustomerName() ?? '';
        if (!name.trim()) return 'C';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusBadge = (status?: string) => {
        if (customer.is_active) {
            return (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    <CheckCircle className="mr-1 h-3 w-3" /> Active
                </Badge>
            );
        }
        return (
            <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                <XCircle className="mr-1 h-3 w-3" /> Inactive
            </Badge>
        );
    };

    const copyToClipboard = async (text: string, label: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.focus();
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            toast.success(`${label} has been copied successfully`);
        } catch (error) {
            console.log(error);
            toast.error('Failed to copy to clipboard');
        }
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
            router.delete(`/customers/${customer.id}`, {
                onSuccess: () => toast.success('Customer has been deleted successfully'),
                onError: () => toast.error('Failed to delete customer'),
            });
        }
    };

    const handleProvisionAccess = () => {
        const actionText = customer.user_id ? 'Restore login access' : 'Provision login access';
        if (confirm(`${actionText} for this customer?`)) {
            router.post(
                `/customers/${customer.id}/provision-access`,
                { send_email: false },
                {
                    onSuccess: () => toast.success('Login access has been granted to the customer'),
                    onError: () => toast.error('Failed to provision access'),
                },
            );
        }
    };

    const handleRevokeAccess = () => {
        if (confirm('Revoke login access for this customer?')) {
            router.delete(`/customers/${customer.id}/revoke-access`, {
                onSuccess: () => toast.success('Login access has been revoked for the customer'),
                onError: () => toast.error('Failed to revoke access'),
            });
        }
    };

    const handleResetPassword = () => {
        if (confirm('Reset password for this customer? A new password will be generated and sent via email.')) {
            router.post(
                route('customers.reset-password', customer.id),
                {},
                {
                    onSuccess: () => toast.success('New password has been generated and sent to the customer via email'),
                    onError: () => toast.error('Failed to reset customer password'),
                },
            );
        }
    };

    return (
        <AppLayout>
            <Head title={`${getCustomerName()} - Customer Details`} />

            <div className="flex-1 space-y-4 pt-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-16 w-16 border border-muted shadow-sm">
                            <AvatarImage
                                src={
                                    customer.type === 'corporate' && customer.logo
                                        ? `/storage/${customer.logo}`
                                        : customer.user?.avatar
                                          ? `/storage/${customer.user.avatar}`
                                          : ''
                                }
                                alt={getCustomerName()}
                            />
                            <AvatarFallback className="bg-primary text-xl text-primary-foreground">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{getCustomerName()}</h1>
                                <div className="flex items-center gap-2">
                                    {getStatusBadge()}
                                    {customer.kyc?.status === 'verified' ? (
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
                            <p className="text-muted-foreground">{customer.email}</p>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" asChild>
                            <Link href={route('customers.kyc.show', customer.id)} className="gap-2">
                                <Shield className="h-4 w-4" />
                                KYC Verification
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={route('customers.edit', customer.id)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Customer
                            </Link>
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => (window.location.href = route('customers.download-pdf', customer.id))}>
                                    <FileText className="mr-2 h-4 w-4" />
                                    Export as PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => (window.location.href = route('customers.download-excel', customer.id))}>
                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                    Export as Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button variant="destructive" onClick={handleDelete}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                </div>

                {/* Login Credentials Alert */}
                {showCredentials && credentials && (
                    <Alert className="border-green-200 bg-green-50 shadow-sm animate-in fade-in zoom-in-95">
                        <Key className="h-4 w-4 text-green-700" />
                        <AlertDescription>
                            <div className="space-y-4">
                                <p className="font-semibold text-green-800">Login credentials generated successfully!</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between rounded border bg-white p-2">
                                        <span className="text-sm">
                                            Email: <strong>{credentials.email}</strong>
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.email, 'Email')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between rounded border bg-white p-2">
                                        <span className="text-sm">
                                            Password: <strong>{credentials.password}</strong>
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.password, 'Password')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between rounded border bg-white p-2">
                                        <span className="text-sm">
                                            Login URL: <strong>{credentials.login_url}</strong>
                                        </span>
                                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(credentials.login_url, 'Login URL')}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCredentials(false)}
                                    className="border-green-300 text-green-700 hover:bg-green-100 hover:text-green-800"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}

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
                            value="claims"
                            className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Claims
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="rounded-md px-3 py-2 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
                        >
                            Transactions
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview">
                        <div className="grid gap-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2 md:grid-cols-3">
                            <div className="space-y-6 md:col-span-2">
                                {/* Basic Info */}
                                <Card className="border-muted/60 shadow-sm">
                                    <CardHeader className="border-b bg-muted/10 pb-4">
                                        <CardTitle className="flex items-center text-lg">
                                            <User className="mr-2 h-5 w-5 text-primary" />
                                            Customer Profile
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="mb-6 flex items-center space-x-4">
                                            <Badge variant={customer.type === 'corporate' ? 'default' : 'secondary'} className="px-3 py-1 shadow-sm">
                                                {customer.type === 'corporate' ? (
                                                    <Building2 className="mr-2 h-4 w-4" />
                                                ) : (
                                                    <User className="mr-2 h-4 w-4" />
                                                )}
                                                {customer.type}
                                            </Badge>
                                            {customer.is_active ? (
                                                <Badge className="bg-emerald-500 px-3 py-1 shadow-sm hover:bg-emerald-600">Active</Badge>
                                            ) : (
                                                <Badge variant="destructive" className="px-3 py-1 shadow-sm">
                                                    Inactive
                                                </Badge>
                                            )}

                                            {customer.user_id && customer.user?.login_access === true && (
                                                <Badge variant="outline" className="border-green-200 bg-green-50 px-3 py-1 text-green-700 shadow-sm">
                                                    <Shield className="mr-2 h-4 w-4" />
                                                    Has Login Access
                                                </Badge>
                                            )}
                                            {customer.user_id && customer.user?.login_access === false && (
                                                <Badge variant="outline" className="border-red-200 bg-red-50 px-3 py-1 text-red-700 shadow-sm">
                                                    <Lock className="mr-2 h-4 w-4" />
                                                    Access Revoked
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 gap-6 text-sm md:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-1">
                                                <span className="flex items-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    <Mail className="mr-1 h-3 w-3" /> Email
                                                </span>
                                                <p className="font-medium text-foreground/90">{customer.email}</p>
                                            </div>
                                            {customer.phone && (
                                                <div className="space-y-1">
                                                    <span className="flex items-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                        <Phone className="mr-1 h-3 w-3" /> Phone
                                                    </span>
                                                    <p className="font-medium text-foreground/90">{customer.phone}</p>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                <span className="flex items-center text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                    <Calendar className="mr-1 h-3 w-3" /> Joined
                                                </span>
                                                <p className="font-medium text-foreground/90">{new Date(customer.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Personal Details (Individual Only) */}
                                {customer.type === 'individual' && (
                                    <Card className="border-muted/60 shadow-sm">
                                        <CardHeader className="border-b bg-muted/10 pb-4">
                                            <CardTitle className="text-lg">Personal Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="grid grid-cols-2 gap-6 text-sm md:grid-cols-4">
                                                {customer.date_of_birth && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            D.O.B
                                                        </span>
                                                        <p className="font-medium text-foreground/90">
                                                            {new Date(customer.date_of_birth).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                )}
                                                {customer.gender && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Gender
                                                        </span>
                                                        <p className="font-medium text-foreground/90 capitalize">{customer.gender}</p>
                                                    </div>
                                                )}
                                                {customer.occupation && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Occupation
                                                        </span>
                                                        <p className="font-medium text-foreground/90">{customer.occupation}</p>
                                                    </div>
                                                )}
                                                {customer.annual_income && (
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                                                            Ann. Income
                                                        </span>
                                                        <p className="font-medium text-foreground/90">
                                                            ₦{parseInt(customer.annual_income).toLocaleString()}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Address Info */}
                                {(customer.address || customer.city || customer.state || customer.country) && (
                                    <Card className="border-muted/60 shadow-sm">
                                        <CardHeader className="border-b bg-muted/10 pb-4">
                                            <CardTitle className="flex items-center text-lg">
                                                <MapPin className="mr-2 h-5 w-5 text-primary" />
                                                Address Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6">
                                            <div className="space-y-2 rounded-lg border border-muted/60 bg-muted/20 p-5 text-sm">
                                                {customer.address && <p className="font-medium">{customer.address}</p>}
                                                <p className="text-muted-foreground">
                                                    {[customer.city, customer.state, customer.country].filter(Boolean).join(', ')}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Login Access Management */}
                                <Card className="border-muted/60 shadow-sm">
                                    <CardHeader className="border-b bg-muted/10 pb-4">
                                        <CardTitle className="flex items-center text-lg">
                                            <Lock className="mr-2 h-5 w-5 text-primary" />
                                            Login Access
                                        </CardTitle>
                                        <CardDescription>Manage customer portal access and credentials</CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {customer.user_id && customer.user?.login_access === true ? (
                                            <div className="space-y-4">
                                                <div className="flex flex-col justify-between gap-4 rounded-lg border border-green-200 bg-green-50/40 p-5 sm:flex-row sm:items-center">
                                                    <div>
                                                        <p className="font-semibold text-green-800">Login Access Enabled</p>
                                                        <p className="mt-1 text-sm text-green-700/80">
                                                            Customer currently has full access to their portal.
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        className="border-red-200 text-red-700 transition-colors hover:bg-red-50 hover:text-red-800"
                                                        onClick={handleRevokeAccess}
                                                    >
                                                        Revoke Access
                                                    </Button>
                                                </div>
                                                <div className="flex flex-col justify-between gap-4 rounded-lg border bg-muted/10 p-5 sm:flex-row sm:items-center">
                                                    <div>
                                                        <p className="font-semibold">Password Management</p>
                                                        <p className="mt-1 text-sm text-muted-foreground">
                                                            Reset customer's password and send new credentials via email.
                                                        </p>
                                                    </div>
                                                    <Button variant="secondary" onClick={handleResetPassword} className="shadow-sm">
                                                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Password
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : customer.user_id && customer.user?.login_access === false ? (
                                            <div className="flex flex-col justify-between gap-4 rounded-lg border border-red-200 bg-red-50/40 p-5 sm:flex-row sm:items-center">
                                                <div>
                                                    <p className="font-semibold text-red-800">Login Access Revoked</p>
                                                    <p className="mt-1 text-sm text-red-700/80">
                                                        Customer has an account but has been restricted from logging in.
                                                    </p>
                                                </div>
                                                <Button onClick={handleProvisionAccess} className="shadow-sm">
                                                    Restore Access
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col justify-between gap-4 rounded-lg border bg-muted/10 p-5 sm:flex-row sm:items-center">
                                                <div>
                                                    <p className="font-semibold">No Login Access</p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        Customer does not have portal access provisioned yet.
                                                    </p>
                                                </div>
                                                <Button onClick={handleProvisionAccess} className="shadow-sm">
                                                    Provision Access
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar Quick Stats */}
                            <div className="space-y-6">
                                <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-md">
                                    <div className="absolute -top-4 -right-4 opacity-5">
                                        <Shield className="h-32 w-32" />
                                    </div>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg">Customer Value</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-extrabold tracking-tight text-primary">
                                            ₦{stats.total_premium.toLocaleString()}
                                        </div>
                                        <p className="mt-2 text-sm font-medium text-muted-foreground">Total Active Premium</p>
                                    </CardContent>
                                </Card>

                                <Card className="border-muted/60 shadow-sm">
                                    <CardHeader className="border-b bg-muted/10 pb-4">
                                        <CardTitle className="flex items-center text-base">
                                            <FileDigit className="mr-2 h-4 w-4 text-primary" />
                                            Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Total Quotes</span>
                                            <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                {stats.total_quotes.toLocaleString()}
                                            </span>
                                        </div>
                                        <Separator className="opacity-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Total Policies</span>
                                            <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                {stats.total_policies.toLocaleString()}
                                            </span>
                                        </div>
                                        <Separator className="opacity-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Active Policies</span>
                                            <span className="min-w-[32px] rounded-full bg-emerald-100 px-2.5 py-0.5 text-center font-bold text-emerald-700">
                                                {stats.active_policies.toLocaleString()}
                                            </span>
                                        </div>
                                        <Separator className="opacity-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Total Claims</span>
                                            <span className="min-w-[32px] rounded-full bg-muted px-2.5 py-0.5 text-center font-bold">
                                                {stats.total_claims?.toLocaleString() || 0}
                                            </span>
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
                                    <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{policyStats.total}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-green-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{policyStats.active}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-yellow-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{policyStats.pending}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-red-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Expired</CardTitle>
                                    <XCircle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{policyStats.expired}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader className="flex flex-row items-center justify-between py-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center text-lg">
                                        <Shield className="mr-2 h-5 w-5 text-primary" /> Policies
                                    </CardTitle>
                                    <CardDescription>Track all active and past policies for this customer.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 flex flex-col gap-4 pt-2 md:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search policy numbers..."
                                            value={policySearch}
                                            onChange={(e) => setPolicySearch(e.target.value)}
                                            className="bg-muted/20 pl-9"
                                        />
                                    </div>
                                    <Select value={policyStatus} onValueChange={setPolicyStatus}>
                                        <SelectTrigger className="w-[180px] bg-muted/20">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="pending_approval">Pending Approval</SelectItem>
                                            <SelectItem value="expired">Expired</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filteredPolicies.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-foreground">Policy Number</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Status</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Premium</TableHead>
                                                    <TableHead className="font-semibold text-foreground">Date Created</TableHead>
                                                    <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredPolicies.map((policy) => (
                                                    <TableRow key={policy.id} className="transition-colors hover:bg-muted/40">
                                                        <TableCell className="font-medium">{policy.policy_number}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={`capitalize ${getPolicyStatusClass(policy.status, policy.expiry_date)}`}
                                                            >
                                                                {policy.status === 'active' &&
                                                                policy.expiry_date &&
                                                                new Date(policy.expiry_date) < new Date()
                                                                    ? 'Expired'
                                                                    : policy.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₦{parseInt(policy.premium_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(policy.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Link href={route('policy-management.show', policy.id)}>View details</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 py-16 text-center text-muted-foreground">
                                        <Shield className="mb-4 h-12 w-12 opacity-10" />
                                        <h3 className="mb-1 text-lg font-medium text-foreground">No Policies Found</h3>
                                        <p className="max-w-md text-sm">There are no policies matching your criteria.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* QUOTES TAB */}
                    <TabsContent value="quotes" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{quoteStats.total}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-blue-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                                    <FileText className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-blue-600">{quoteStats.draft}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-yellow-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Sent Quotes</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-600">{quoteStats.sent}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-green-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Accepted</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">{quoteStats.accepted}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader className="py-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center text-lg">
                                        <FileText className="mr-2 h-5 w-5 text-primary" /> Quotes
                                    </CardTitle>
                                    <CardDescription>Review quotes shared with or accepted by the customer.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 flex flex-col gap-4 pt-2 md:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search quotes..."
                                            value={quoteSearch}
                                            onChange={(e) => setQuoteSearch(e.target.value)}
                                            className="bg-muted/20 pl-9"
                                        />
                                    </div>
                                    <Select value={quoteStatus} onValueChange={setQuoteStatus}>
                                        <SelectTrigger className="w-[180px] bg-muted/20">
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

                                {filteredQuotes.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Quote Number</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Amount</TableHead>
                                                    <TableHead className="font-semibold">Date Created</TableHead>
                                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredQuotes.map((quote) => (
                                                    <TableRow key={quote.id} className="transition-colors hover:bg-muted/40">
                                                        <TableCell className="font-medium">{quote.quote_number}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`capitalize ${getQuoteStatusClass(quote.status)}`}>
                                                                {quote.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₦{parseInt(quote.total_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(quote.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Link href={route('quotes.show', quote.id)}>View details</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 py-16 text-center text-muted-foreground">
                                        <FileText className="mb-4 h-12 w-12 opacity-10" />
                                        <h3 className="mb-1 text-lg font-medium text-foreground">No Quotes Found</h3>
                                        <p className="max-w-md text-sm">There are no quotes matching your criteria.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CLAIMS TAB */}
                    <TabsContent value="claims" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{claimStats.total}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-yellow-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                                    <Clock className="h-4 w-4 text-yellow-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-yellow-700">{claimStats.pending}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-green-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-700">{claimStats.approved}</div>
                                </CardContent>
                            </Card>
                            <Card className="border-red-200 shadow-sm">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Rejected Claims</CardTitle>
                                    <XCircle className="h-4 w-4 text-red-600" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-700">{claimStats.rejected}</div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="shadow-sm">
                            <CardHeader className="py-4">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center text-lg">
                                        <AlertDescription className="mr-2 h-5 w-5 text-primary" /> Claims history
                                    </CardTitle>
                                    <CardDescription>Track claims filed by this customer on their policies.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-6 flex flex-col gap-4 pt-2 md:flex-row">
                                    <div className="relative flex-1">
                                        <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search claims..."
                                            value={claimSearch}
                                            onChange={(e) => setClaimSearch(e.target.value)}
                                            className="bg-muted/20 pl-9"
                                        />
                                    </div>
                                    <Select value={claimStatus} onValueChange={setClaimStatus}>
                                        <SelectTrigger className="w-[180px] bg-muted/20">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="submitted">Submitted</SelectItem>
                                            <SelectItem value="under_review">Under Review</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                            <SelectItem value="settled">Settled</SelectItem>
                                            <SelectItem value="closed">Closed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {filteredClaims.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Claim Ref</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Claim Amount</TableHead>
                                                    <TableHead className="font-semibold">Date Submitted</TableHead>
                                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredClaims.map((claim) => (
                                                    <TableRow key={claim.id} className="transition-colors hover:bg-muted/40">
                                                        <TableCell className="font-medium">{claim.claim_reference}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={`capitalize ${getClaimStatusClass(claim.status)}`}>
                                                                {claim.status.replace(/_/g, ' ')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₦{parseInt(claim.claim_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(claim.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Link href={route('claims.show', claim.id)}>View details</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 py-16 text-center text-muted-foreground">
                                        <AlertDescription className="mb-4 h-12 w-12 opacity-10" />
                                        <h3 className="mb-1 text-lg font-medium text-foreground">No Claims Found</h3>
                                        <p className="max-w-md text-sm">There are no claims matching your criteria.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TRANSACTIONS TAB */}
                    <TabsContent value="transactions" className="space-y-6 duration-500 animate-in fade-in-50 slide-in-from-bottom-2">
                        {/* Invoices */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/5 py-4">
                                <CardTitle className="flex items-center text-lg">
                                    <FileDigit className="mr-2 h-5 w-5 text-primary" />
                                    Invoices
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {customer.invoices && customer.invoices.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Invoice #</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Total Amount</TableHead>
                                                    <TableHead className="font-semibold">Date</TableHead>
                                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customer.invoices.map((invoice) => (
                                                    <TableRow key={invoice.id} className="transition-colors hover:bg-muted/40">
                                                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={`capitalize ${getInvoiceStatusClass(invoice.status)}`}
                                                            >
                                                                {invoice.status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₦{parseInt(invoice.total_amount).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(invoice.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Link href={route('invoices.show', invoice.id)}>View details</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
                                        <FileDigit className="mb-3 h-10 w-10 opacity-10" />
                                        <h3 className="mb-1 text-base font-medium text-foreground">No Invoices</h3>
                                        <p className="max-w-md text-sm">Customer doesn't have any generated invoices.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Receipts */}
                        <Card className="shadow-sm">
                            <CardHeader className="border-b bg-muted/5 py-4">
                                <CardTitle className="flex items-center text-lg">
                                    <ReceiptIcon className="mr-2 h-5 w-5 text-primary" />
                                    Receipts
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {customer.receipts && customer.receipts.length > 0 ? (
                                    <div className="overflow-hidden rounded-lg border shadow-sm">
                                        <Table>
                                            <TableHeader className="bg-muted/50">
                                                <TableRow>
                                                    <TableHead className="font-semibold">Receipt #</TableHead>
                                                    <TableHead className="font-semibold">Status</TableHead>
                                                    <TableHead className="font-semibold">Amount Paid</TableHead>
                                                    <TableHead className="font-semibold">Date</TableHead>
                                                    <TableHead className="text-right font-semibold">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customer.receipts.map((receipt) => (
                                                    <TableRow key={receipt.id} className="transition-colors hover:bg-muted/40">
                                                        <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={`capitalize ${getReceiptStatusClass(receipt.payment_status)}`}
                                                            >
                                                                {receipt.payment_status}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            ₦{parseInt(receipt.amount_paid).toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {new Date(receipt.created_at).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                asChild
                                                                className="hover:bg-primary/10 hover:text-primary"
                                                            >
                                                                <Link href={route('receipts.show', receipt.id)}>View details</Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/10 py-12 text-center text-muted-foreground">
                                        <ReceiptIcon className="mb-3 h-10 w-10 opacity-10" />
                                        <h3 className="mb-1 text-base font-medium text-foreground">No Receipts</h3>
                                        <p className="max-w-md text-sm">Customer doesn't have any payment receipts.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
