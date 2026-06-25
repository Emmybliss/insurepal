import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import useFlashToast from '@/hooks/useFlashToast';
import { useLang } from '@/hooks/useLang';
import { getTimeBasedGreeting } from '@/lib/greeting';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    FileCheck2,
    FileText,
    MessageSquarePlus,
    Shield,
    ShieldCheck,
    TrendingUp,
    Wallet,
    XCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Stats {
    total_quotes: number;
    total_policies: number;
    active_policies: number;
    total_premium: number;
    total_claims: number;
    pending_claims: number;
    expiring_policies: number;
    expired_policies: number;
}

interface PolicyType {
    name: string;
    code: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    expiry_date: string;
    premium_amount: number;
    policy_type?: PolicyType;
}

interface Quote {
    id: number;
    quote_number: string;
    status: string;
    premium_amount: number;
    valid_until: string;
    created_at: string;
}

interface Claim {
    id: number;
    claim_reference: string;
    status: string;
    claim_amount: number;
    claim_type: string;
    incident_date: string;
    policy?: { policy_number: string };
}

interface Customer {
    id: number;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    type: string;
    email: string;
    phone?: string;
    city?: string;
    country?: string;
}

interface KycRecord {
    id?: number;
    status: string;
    identity_type?: string;
    identity_number?: string;
    identity_document_path?: string;
    address_document_path?: string;
    verified_at?: string;
}

interface Tenant {
    name: string;
    type: string;
    logo?: string;
}

interface User {
    name: string;
    email: string;
}

interface Props {
    user: User;
    tenant: Tenant;
    customer: Customer;
    kyc: KycRecord | null;
    stats: Stats;
    policies: Policy[];
    recent_quotes: Quote[];
    recent_claims: Claim[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount ?? 0);

const formatDate = (date: string) => (date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const getPolicyStatus = (policy: Policy) => {
    if (policy.status && policy.status !== 'active' && policy.status !== 'expired') return policy.status;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(policy.expiry_date);
    expiryDate.setHours(0, 0, 0, 0);

    if (expiryDate < today) return 'expired';

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 60) return 'expiring_soon';
    if (diffDays <= 90) return 'active';

    return 'active';
};

const policyStatusConfig: Record<string, { label: string; color: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', color: 'text-emerald-600', variant: 'default' },
    expired: { label: 'Expired', color: 'text-red-500', variant: 'destructive' },
    expiring_soon: { label: 'Expiring Soon', color: 'text-amber-500', variant: 'outline' },
    cancelled: { label: 'Cancelled', color: 'text-gray-400', variant: 'outline' },
    pending: { label: 'Pending', color: 'text-amber-500', variant: 'secondary' },
};

const claimStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
    draft: { label: 'Draft', variant: 'outline', icon: <Clock className="h-3 w-3" /> },
    submitted: { label: 'Submitted', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    under_review: { label: 'Under Review', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
    info_requested: { label: 'Info Needed', variant: 'outline', icon: <AlertCircle className="h-3 w-3" /> },
    approved: { label: 'Approved', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    rejected: { label: 'Rejected', variant: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
    settled: { label: 'Settled', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
    closed: { label: 'Closed', variant: 'outline', icon: <CheckCircle2 className="h-3 w-3" /> },
};

const quoteStatusConfig: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    draft: 'outline',
    sent: 'secondary',
    accepted: 'default',
    rejected: 'destructive',
    expired: 'destructive',
};

// ── Component ────────────────────────────────────────────────────────────────

export default function CustomerDashboard({ tenant, customer, kyc, stats, policies, recent_quotes, recent_claims }: Props) {
    useFlashToast();
    const { t } = useLang();

    const customerName = customer.type === 'corporate' ? customer.company_name : `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim();

    const coverageUtilisation = stats.total_policies > 0 ? Math.round((stats.active_policies / stats.total_policies) * 100) : 0;

    return (
        <AppLayout>
            <Head title="My Dashboard" />

            <div className="flex-1 space-y-6 pt-4">
                {/* ── Welcome Header ─────────────────────────────────────── */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">
                            {getTimeBasedGreeting()}, {customerName} 👋
                        </h2>
                        <p className="mt-1 text-muted-foreground">
                            {t('Your personal insurance overview with')} <span className="font-medium text-foreground">{tenant.name}</span>
                        </p>
                    </div>
                    <div className="mt-3 flex gap-2 sm:mt-0">
                        <Link href="/support-tickets/create">
                            <Button variant="outline" size="sm">
                                <MessageSquarePlus className="mr-2 h-4 w-4" />
                                {t('Get Support')}
                            </Button>
                        </Link>
                        <Link href="/claims/create">
                            <Button size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                {t('File a Claim')}
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* KYC Status Banner */}
                {(() => {
                    if (!kyc || kyc.status === 'pending') {
                        return (
                            <div
                                className={`flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${
                                    !kyc ? 'border-muted-foreground/20 bg-muted/10' : 'border-amber-200 bg-amber-50'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {!kyc ? (
                                        <FileCheck2 className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                    ) : (
                                        <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
                                    )}
                                    <div>
                                        <p className={`text-sm font-semibold ${!kyc ? 'text-foreground' : 'text-amber-800'}`}>
                                            {!kyc ? 'KYC Verification Required' : 'KYC Verification Pending'}
                                        </p>
                                        <p className={`mt-0.5 text-xs ${!kyc ? 'text-muted-foreground' : 'text-amber-700'}`}>
                                            {!kyc
                                                ? 'Please submit your identity documents to complete verification.'
                                                : 'Your documents are under review. We will notify you once verified.'}
                                        </p>
                                    </div>
                                </div>
                                <Link href="/my-kyc">
                                    <Button size="sm" variant={!kyc ? 'default' : 'outline'} className="shrink-0">
                                        <FileCheck2 className="mr-2 h-4 w-4" />
                                        {!kyc ? 'Complete KYC' : 'View Status'}
                                    </Button>
                                </Link>
                            </div>
                        );
                    }
                    if (kyc.status === 'rejected') {
                        return (
                            <div className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-red-800">KYC Verification Rejected</p>
                                        <p className="mt-0.5 text-xs text-red-700">Your documents were rejected. Please re-upload and resubmit.</p>
                                    </div>
                                </div>
                                <Link href="/my-kyc">
                                    <Button size="sm" variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100">
                                        <FileCheck2 className="mr-2 h-4 w-4" /> Resubmit KYC
                                    </Button>
                                </Link>
                            </div>
                        );
                    }
                    if (kyc.status === 'verified') {
                        return (
                            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">KYC Verified ✓</p>
                                    <p className="mt-0.5 text-xs text-emerald-700">
                                        Your identity has been verified.
                                        {kyc.verified_at ? ` Verified on ${new Date(kyc.verified_at).toLocaleDateString()}.` : ''}
                                    </p>
                                </div>
                            </div>
                        );
                    }
                    return null;
                })()}

                {/* ── Stats Cards ────────────────────────────────────────── */}
                <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/policies', { status: 'active' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Active Policies')}</CardTitle>
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_policies}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.total_policies} {t('total policies')}
                            </p>
                            <Progress value={coverageUtilisation} className="mt-2 h-1.5" />
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/policies', { expiring_soon: 1 })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Expiring Policies')}</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{stats.expiring_policies}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Policies expiring in 60 days')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/policies', { status: 'expired' })}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Expired Policies')}</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.expired_policies}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Policies past expiration')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/policies')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Premium')}</CardTitle>
                            <Wallet className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_premium)}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Active policies premium value')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/quotes')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('My Quotes')}</CardTitle>
                            <TrendingUp className="h-4 w-4 text-violet-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_quotes}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Quotes requested to date')}</p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
                        onClick={() => router.get('/claims')}
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Claims')}</CardTitle>
                            <AlertCircle className={`h-4 w-4 ${stats.pending_claims > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_claims}</div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {stats.pending_claims > 0 ? (
                                    <span className="font-medium text-amber-500">
                                        {stats.pending_claims} {t('pending review')}
                                    </span>
                                ) : (
                                    t('No pending claims')
                                )}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Main Content Grid ──────────────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Active Policies - 2 cols */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Shield className="h-5 w-5 text-emerald-500" />
                                        {t('My Active Policies')}
                                    </CardTitle>
                                    <CardDescription>{t('Your currently active insurance coverages')}</CardDescription>
                                </div>
                                <Link href="/policies">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        {t('All Policies')} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {policies.length > 0 ? (
                                <div className="space-y-3">
                                    {policies.map((policy) => {
                                        return (
                                            <div
                                                key={policy.id}
                                                className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/30">
                                                        <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{policy.policy_number}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {policy.policy_type?.name ?? 'Insurance Policy'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="hidden text-right sm:block">
                                                        <p className="text-sm font-semibold">{formatCurrency(policy.premium_amount)}</p>
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                            <Calendar className="h-3 w-3" />
                                                            {t('Expires')} {formatDate(policy.expiry_date)}
                                                        </div>
                                                    </div>
                                                    {(() => {
                                                        const derivedStatus = getPolicyStatus(policy);
                                                        const cfg = policyStatusConfig[derivedStatus] ?? policyStatusConfig['pending'];
                                                        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
                                                    })()}
                                                    <Link href={`/policies/${policy.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                    <Shield className="mb-3 h-12 w-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground">{t('No active policies yet')}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">{t('Contact your insurer to get covered')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Quotes - 1 col */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>{t('Recent Quotes')}</CardTitle>
                                    <CardDescription>{t('Your latest quote requests')}</CardDescription>
                                </div>
                                <Link href="/quotes">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        {t('View All')} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recent_quotes.length > 0 ? (
                                <div className="space-y-3">
                                    {recent_quotes.map((quote) => (
                                        <div
                                            key={quote.id}
                                            className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/40"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold">{quote.quote_number}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {formatCurrency(quote.premium_amount)} · {formatDate(quote.valid_until)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={quoteStatusConfig[quote.status] ?? 'outline'}>{quote.status}</Badge>
                                                <Link href={`/quotes/${quote.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <FileText className="mb-3 h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">{t('No quotes yet')}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Claims Section ─────────────────────────────────────── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-amber-500" />
                                    {t('My Claims')}
                                </CardTitle>
                                <CardDescription>{t('Track the status of your insurance claims')}</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Link href="/claims">
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        {t('All Claims')} <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                                <Link href="/claims/create">
                                    <Button size="sm">+ {t('New Claim')}</Button>
                                </Link>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {recent_claims.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2">
                                {recent_claims.map((claim) => {
                                    const cfg = claimStatusConfig[claim.status] ?? { label: claim.status, variant: 'outline', icon: null };
                                    return (
                                        <div
                                            key={claim.id}
                                            className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-semibold">{claim.claim_reference}</p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {claim.claim_type.replace(/_/g, ' ')}
                                                    {claim.policy ? ` · ${claim.policy.policy_number}` : ''}
                                                </p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(claim.incident_date)}
                                                </div>
                                                <p className="text-sm font-medium">{formatCurrency(Number(claim.claim_amount))}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Badge variant={cfg.variant} className="flex items-center gap-1">
                                                    {cfg.icon}
                                                    {cfg.label}
                                                </Badge>
                                                <Link href={`/claims/${claim.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle2 className="mb-3 h-12 w-12 text-emerald-400/50" />
                                <p className="text-muted-foreground">{t('No claims filed yet')}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{t("You're all good! File a claim if you need assistance.")}</p>
                                <Link href="/claims/create">
                                    <Button className="mt-4" size="sm" variant="outline">
                                        {t('File a Claim')}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
