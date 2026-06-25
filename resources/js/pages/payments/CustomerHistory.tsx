import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useFlashToast from '@/hooks/useFlashToast';
import { useLang } from '@/hooks/useLang';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, CreditCard, FileText, Search, Wallet } from 'lucide-react';
import { useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Policy {
    policy_number: string;
}
interface Receipt {
    id: number;
    receipt_number: string;
    payment_date: string;
    payment_method: string;
    payment_reference?: string;
    amount_paid: number;
    payment_status: string;
    currency?: string;
    policy?: Policy;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}
interface PaginatedReceipts {
    data: Receipt[];
    links: PaginationLink[];
    meta?: { current_page: number; last_page: number; total: number; per_page: number };
    total?: number;
    current_page?: number;
    last_page?: number;
}

interface Customer {
    first_name?: string;
    last_name?: string;
    company_name?: string;
    type: string;
}

interface Stats {
    total_paid: number;
    total_count: number;
    pending_count: number;
}

interface Props {
    receipts: PaginatedReceipts;
    customer: Customer;
    stats: Stats;
    filters: { status?: string; search?: string };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n ?? 0);

const fmtDate = (d: string) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    completed: { label: 'Completed', variant: 'default' },
    pending: { label: 'Pending', variant: 'secondary' },
    failed: { label: 'Failed', variant: 'destructive' },
    refunded: { label: 'Refunded', variant: 'outline' },
    voided: { label: 'Voided', variant: 'outline' },
};

const methodLabel = (m: string) => (m ? m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—');

// ── Component ────────────────────────────────────────────────────────────────

export default function CustomerHistory({ receipts, customer, stats, filters }: Props) {
    useFlashToast();
    const { t } = useLang();

    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');

    const applyFilters = () => {
        router.get(
            route('payments.history'),
            {
                search: search || undefined,
                status: status !== 'all' ? status : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const total = receipts.meta?.total ?? receipts.total ?? 0;
    const curPage = receipts.meta?.current_page ?? receipts.current_page ?? 1;
    const lastPage = receipts.meta?.last_page ?? receipts.last_page ?? 1;

    return (
        <AppLayout>
            <Head title="Payment History" />

            <div className="flex-1 space-y-6 pt-4">
                {/* Header */}
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('Payment History')}</h2>
                    <p className="mt-1 text-muted-foreground">{t('All your insurance premium payments and receipts')}</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Paid')}</CardTitle>
                            <Wallet className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{fmt(stats.total_paid)}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Completed payments')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Total Transactions')}</CardTitle>
                            <CreditCard className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_count}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('All time receipts')}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{t('Pending Payments')}</CardTitle>
                            <FileText className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending_count}</div>
                            <p className="mt-1 text-xs text-muted-foreground">{t('Awaiting confirmation')}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder={t('Search by receipt # or reference…')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={status}
                        onValueChange={(v) => {
                            setStatus(v);
                        }}
                    >
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder={t('Status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('All')}</SelectItem>
                            <SelectItem value="completed">{t('Completed')}</SelectItem>
                            <SelectItem value="pending">{t('Pending')}</SelectItem>
                            <SelectItem value="failed">{t('Failed')}</SelectItem>
                            <SelectItem value="refunded">{t('Refunded')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={applyFilters}>{t('Filter')}</Button>
                </div>

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        {receipts.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-muted/40">
                                                <th className="px-4 py-3 text-left font-medium">{t('Receipt #')}</th>
                                                <th className="px-4 py-3 text-left font-medium">{t('Policy')}</th>
                                                <th className="px-4 py-3 text-left font-medium">{t('Date')}</th>
                                                <th className="px-4 py-3 text-left font-medium">{t('Method')}</th>
                                                <th className="px-4 py-3 text-right font-medium">{t('Amount')}</th>
                                                <th className="px-4 py-3 text-center font-medium">{t('Status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {receipts.data.map((r) => {
                                                const cfg = statusConfig[r.payment_status] ?? {
                                                    label: r.payment_status,
                                                    variant: 'outline' as const,
                                                };
                                                return (
                                                    <tr key={r.id} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                                                        <td className="px-4 py-3 font-mono text-xs font-semibold">{r.receipt_number}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{r.policy?.policy_number ?? '—'}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.payment_date)}</td>
                                                        <td className="px-4 py-3">{methodLabel(r.payment_method)}</td>
                                                        <td className="px-4 py-3 text-right font-semibold">{fmt(r.amount_paid)}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant={cfg.variant}>{cfg.label}</Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination info */}
                                {lastPage > 1 && (
                                    <div className="flex items-center justify-between border-t px-4 py-3 text-xs text-muted-foreground">
                                        <span>
                                            {t('Page')} {curPage} {t('of')} {lastPage} · {total} {t('records')}
                                        </span>
                                        <div className="flex gap-2">
                                            {receipts.links
                                                .filter((l) => !['&laquo; Previous', 'Next &raquo;'].includes(l.label))
                                                .map((link, i) => (
                                                    <button
                                                        key={i}
                                                        disabled={!link.url || link.active}
                                                        onClick={() => link.url && router.get(link.url)}
                                                        className={`rounded px-2 py-1 ${link.active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'} disabled:opacity-40`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <CheckCircle2 className="mb-3 h-12 w-12 text-muted-foreground/30" />
                                <p className="text-muted-foreground">{t('No payment records found')}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {t('Your insurance payment receipts will appear here once payments are recorded.')}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
