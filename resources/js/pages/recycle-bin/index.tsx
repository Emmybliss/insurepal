import { AlertTriangle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-permissions';
import { useLang } from '@/hooks/useLang';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';

interface RecycleBinItem {
    type: string;
    id: number;
    display_name: string;
    deleted_at: string | null;
    auto_delete_at: string | null;
    days_remaining: number | null;
    metadata?: {
        policy_number?: string;
        internal_reference?: string;
        customer_name?: string;
    };
}

interface Props {
    items: RecycleBinItem[];
    meta: {
        current_page: number;
        per_page: number;
        total: number;
        total_pages: number;
    };
    filters: {
        type?: string;
        search?: string;
    };
    available_types: string[];
}

const typeLabels: Record<string, string> = {
    customers: 'Customer',
    policies: 'Policy',
    quotes: 'Quote',
    claims: 'Claim',
    'debit-notes': 'Debit Note',
    'credit-notes': 'Credit Note',
    documents: 'Document',
};

export default function RecycleBinIndex({ items, meta, filters, available_types }: Props) {
    const { t } = useLang();
    const auth = useAuth();
    const { can, hasRole } = auth;
    const canRestore = can('recycle_bin_restore');
    const canForceDelete = can('recycle_bin_force_delete');
    const isSuperAdmin = hasRole('super_admin');

    const [search, setSearch] = useState(filters.search || '');
    const [typeFilter, setTypeFilter] = useState(filters.type || 'all');
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean;
        item: RecycleBinItem | null;
    }>({ open: false, item: null });
    const [restoreDialog, setRestoreDialog] = useState<{
        open: boolean;
        item: RecycleBinItem | null;
        message: string;
    }>({ open: false, item: null, message: '' });
    const [processing, setProcessing] = useState(false);

    const handleSearch = () => {
        router.get(route('recycle-bin.index'), { search, type: typeFilter === 'all' ? undefined : typeFilter }, { preserveState: true });
    };

    const handleTypeChange = (value: string) => {
        setTypeFilter(value);
        router.get(
            route('recycle-bin.index'),
            {
                search,
                type: value === 'all' ? undefined : value,
            },
            { preserveState: true },
        );
    };

    const handleRestore = (item: RecycleBinItem, restorePolicy: boolean = false) => {
        setProcessing(true);
        router.post(
            route('recycle-bin.restore', {
                type: item.type,
                id: item.id,
            }),
            { restore_policy: restorePolicy },
            {
                onSuccess: (page: { props: { flash?: { error?: string; success?: string } } }) => {
                    if (page.props.flash?.error) {
                        const errMsg = page.props.flash.error;
                        if (errMsg.includes("Restore with Policy")) {
                            setRestoreDialog({
                                open: true,
                                item,
                                message: errMsg,
                            });
                        } else {
                            toast.error(errMsg);
                        }
                    } else {
                        toast.success(page.props.flash?.success || t('Record restored successfully'));
                        setRestoreDialog({ open: false, item: null, message: '' });
                    }
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(errors?.error || errors?.message || t('Failed to restore record'));
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    const handleForceDelete = () => {
        if (!deleteDialog.item) return;

        setProcessing(true);
        router.delete(
            route('recycle-bin.force-delete', {
                type: deleteDialog.item.type,
                id: deleteDialog.item.id,
            }),
            {
                onSuccess: (page: { props: { flash?: { error?: string } } }) => {
                    if (page.props.flash?.error) {
                        toast.error(page.props.flash.error);
                    } else {
                        toast.success(t('Record permanently deleted'));
                        setDeleteDialog({ open: false, item: null });
                    }
                },
                onError: (errors: Record<string, string>) => {
                    toast.error(errors?.error || errors?.message || t('Failed to delete record'));
                },
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <>
            <Head title={t('Recycle Bin')} />
            <AppLayout>
                <div className="space-y-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{t('Recycle Bin')}</h2>
                            <p className="text-muted-foreground">{t('Recover or permanently delete records')}</p>
                        </div>
                    </div>

                    <div className="rounded-md border bg-card p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                <span className="text-sm text-amber-600 dark:text-amber-500">
                                    {t('Records are automatically deleted after 30 days')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="flex flex-1 items-center gap-2">
                            <Input
                                placeholder={t('Search...')}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="max-w-sm"
                            />
                            <Button onClick={handleSearch} variant="secondary">
                                {t('Search')}
                            </Button>
                        </div>
                        <Select value={typeFilter} onValueChange={handleTypeChange}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder={t('All Types')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">{t('All Types')}</SelectItem>
                                {available_types.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {typeLabels[type] || type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('Type')}</TableHead>
                                    <TableHead>{t('Name / Reference')}</TableHead>
                                    <TableHead>{t('Deleted At')}</TableHead>
                                    <TableHead>{t('Auto Delete')}</TableHead>
                                    <TableHead>{t('Days Left')}</TableHead>
                                    <TableHead className="text-right">{t('Actions')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                <p>{t('No deleted records found')}</p>
                                                <p className="text-sm">{t('Records you delete will appear here')}</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((item) => (
                                        <TableRow key={`${item.type}-${item.id}`}>
                                            <TableCell>
                                                <Badge variant="outline">{typeLabels[item.type] || item.type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div>{item.display_name}</div>
                                                {item.type === 'policies' && item.metadata && (
                                                    <div className="mt-0.5 space-y-0.5 text-xs font-normal text-muted-foreground">
                                                        {item.metadata.internal_reference && <div>Ref: {item.metadata.internal_reference}</div>}
                                                        {item.metadata.customer_name && <div>Customer: {item.metadata.customer_name}</div>}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>{item.deleted_at ? new Date(item.deleted_at).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>{item.auto_delete_at ? new Date(item.auto_delete_at).toLocaleDateString() : '-'}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={
                                                        item.days_remaining !== null && item.days_remaining <= 7 ? 'font-medium text-red-600' : ''
                                                    }
                                                >
                                                    {item.days_remaining !== null ? `${item.days_remaining} ${t('days')}` : '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canRestore && (
                                                        <Button variant="outline" size="sm" onClick={() => handleRestore(item)} disabled={processing}>
                                                            {t('Restore')}
                                                        </Button>
                                                    )}
                                                    {isSuperAdmin && canForceDelete && (
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                setDeleteDialog({
                                                                    open: true,
                                                                    item,
                                                                })
                                                            }
                                                            disabled={processing}
                                                        >
                                                            {t('Delete')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {meta.total_pages > 1 && (
                        <div className="flex justify-center gap-2">
                            {Array.from({ length: meta.total_pages }, (_, i) => i + 1).map((page) => (
                                <Button
                                    key={page}
                                    variant={meta.current_page === page ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() =>
                                        router.get(
                                            route('recycle-bin.index'),
                                            {
                                                page,
                                                search,
                                                type: typeFilter === 'all' ? undefined : typeFilter,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, item: deleteDialog.item })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('Permanently Delete')}</DialogTitle>
                            <DialogDescription>
                                {t('Are you sure you want to permanently delete this record? This action cannot be undone.')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            {deleteDialog.item && (
                                <div className="rounded-md border p-4">
                                    <p className="font-medium">{deleteDialog.item.display_name}</p>
                                    <p className="text-sm text-muted-foreground">{typeLabels[deleteDialog.item.type] || deleteDialog.item.type}</p>
                                </div>
                            )}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, item: null })}>
                                {t('Cancel')}
                            </Button>
                            <Button variant="destructive" onClick={handleForceDelete} disabled={processing}>
                                {processing ? t('Deleting...') : t('Permanently Delete')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={restoreDialog.open} onOpenChange={(open) => setRestoreDialog({ open, item: restoreDialog.item, message: restoreDialog.message })}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('Restore Linked Policy')}</DialogTitle>
                            <DialogDescription className="whitespace-pre-line text-foreground/90">
                                {restoreDialog.message}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                            <Button variant="outline" onClick={() => setRestoreDialog({ open: false, item: null, message: '' })}>
                                {t('Cancel')}
                            </Button>
                            <Button
                                variant="default"
                                onClick={() => restoreDialog.item && handleRestore(restoreDialog.item, true)}
                                disabled={processing}
                            >
                                {processing ? t('Restoring...') : t('Restore Record & Policy Together')}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </AppLayout>
        </>
    );
}
