import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Calendar, Clock, CreditCard, DollarSign, Edit, FileText, Mail, MoreHorizontal, RefreshCw, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { useCanSms } from '@/hooks/use-plan';

interface Customer {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    type: string;
    company_name?: string;
}

interface PolicyClass {
    id: number;
    name: string;
}

interface Tenant {
    id: number;
    company_name: string;
}

interface Quote {
    id: number;
    quote_number: string;
}

interface FinancialNote {
    id: number;
    note_number: string;
    type: 'debit' | 'credit';
    amount: number;
    status: string;
    issue_date: string;
    due_date?: string;
}

interface Policy {
    id: number;
    policy_number: string;
    status: string;
    approval_status: string;
    effective_date: string;
    expiry_date: string;
    premium_amount: number;
    commission_amount: number;
    total_amount: number;
    payment_frequency: string;
    notes?: string;
    internal_notes?: string;
    renewed_at?: string;
    issued_at?: string;
    customer: Customer;
    policy_class?: PolicyClass;
    tenant: Tenant;
    quote?: Quote;
    debit_notes: FinancialNote[];
}

interface NotificationLog {
    id: number;
    channel: string;
    recipient: string;
    is_successful: boolean;
    notice_type: string;
    created_at: string;
}

interface RenewalHistory {
    renewals: any[];
    reminders_sent: NotificationLog[];
    payments: any[];
}

interface Props extends PageProps {
    policy: Policy;
    renewalHistory: RenewalHistory;
}

export default function ShowRenewal({ policy, renewalHistory }: Props) {
    const { canUseSms, upgradeUrl } = useCanSms();

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'expired':
                return <Badge variant="destructive">Expired</Badge>;
            case 'cancelled':
                return <Badge variant="secondary">Cancelled</Badge>;
            case 'suspended':
                return <Badge className="bg-yellow-100 text-yellow-800">Suspended</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getRenewalStatusBadge = () => {
        const expiryDate = new Date(policy.expiry_date);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (policy.renewed_at) {
            return <Badge className="bg-green-100 text-green-800">Renewed</Badge>;
        } else if (daysUntilExpiry < 0) {
            return <Badge variant="destructive">Overdue</Badge>;
        } else if (daysUntilExpiry <= 30) {
            return <Badge className="bg-orange-100 text-orange-800">Due Soon ({daysUntilExpiry} days)</Badge>;
        } else {
            return <Badge variant="outline">Upcoming ({daysUntilExpiry} days)</Badge>;
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
        }).format(amount);
    };

    const getCustomerDisplayName = () => {
        if (policy?.customer?.type === 'individual') {
            return `${policy.customer.first_name} ${policy.customer.last_name}`.trim();
        }
        return policy?.customer?.company_name || 'Unknown Company';
    };

    const processRenewal = () => {
        // This would open a renewal form or modal
        router.visit(route('renewals.edit', policy.id));
    };

    const sendReminder = (channel: string) => {
        router.post(
            route('renewals.send-notice', { policy: policy.id }),
            { channel },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                },
                onError: () => toast.error('Failed to send reminder request'),
            },
        );
    };

    const sendReminderToAllChannels = () => {
        router.post(
            route('renewals.send-notice-all', { policy: policy.id }),
            {},
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                },
                onError: () => toast.error('Failed to send reminder request'),
            },
        );
    };

    const clearNotificationLogs = () => {
        router.delete(
            route('renewals.clear-logs', { policy: policy.id }),
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as { success?: string; error?: string };
                    if (flash?.success) toast.success(flash.success);
                    if (flash?.error) toast.error(flash.error);
                    router.reload({ only: ['renewalHistory'] });
                },
                onError: () => toast.error('Failed to clear logs'),
            },
        );
    };

    return (
        <AppLayout>
            <Head title={`Renewal Details - ${policy.policy_number}`} />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Link href={route('renewals.index')} className="flex items-center text-gray-500 hover:text-gray-700">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Policy Renewal Details</h1>
                            <p className="text-muted-foreground">
                                {policy.policy_number} • {getCustomerDisplayName()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {getRenewalStatusBadge()}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={processRenewal}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Process Renewal
                                </DropdownMenuItem>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <DropdownMenuItem className="flex w-full items-center" onSelect={(e) => e.preventDefault()}>
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Reminder
                                        </DropdownMenuItem>
                                    </DropdownMenuTrigger>
<DropdownMenuContent side="left">
                                        <DropdownMenuItem onClick={() => sendReminder('email')}>Via Email</DropdownMenuItem>
                                        {canUseSms ? (
                                            <DropdownMenuItem onClick={() => sendReminder('sms')}>Via SMS</DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => router.visit(upgradeUrl)}
                                                className="text-muted-foreground cursor-not-allowed"
                                            >
                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                Via SMS (Enterprise)
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => sendReminder('portal')}>Via Portal</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => sendReminderToAllChannels()}>To All Channels</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href={route('policy-management.show', policy?.id)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Policy
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href={route('renewals.edit', policy.id)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Renewal
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Policy Information */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Policy Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <FileText className="h-5 w-5" />
                                    <span>Policy Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Policy Number</label>
                                        <p className="font-mono text-sm">{policy.policy_number}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Status</label>
                                        <div className="mt-1">{getStatusBadge(policy.status)}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Effective Date</label>
                                        <p className="text-sm">{formatDate(policy.effective_date)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Expiry Date</label>
                                        <p className="text-sm">{formatDate(policy.expiry_date)}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Payment Frequency</label>
                                        <p className="text-sm capitalize">{policy.payment_frequency}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Policy Class</label>
                                        <p className="text-sm">{policy.policy_class?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                {policy.notes && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Notes</label>
                                        <p className="mt-1 rounded-md bg-gray-50 dark:bg-gray-800 p-3 text-sm">{policy.notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <User className="h-5 w-5" />
                                    <span>Customer Information</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-sm">{getCustomerDisplayName()}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Type</label>
                                        <p className="text-sm capitalize">{policy.customer.type}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Email</label>
                                        <p className="text-sm">{policy.customer.email}</p>
                                    </div>
                                    {policy.customer.phone && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Phone</label>
                                            <p className="text-sm">{policy.customer.phone}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Renewal History */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Clock className="h-5 w-5" />
                                    <span>Renewal History</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {policy.renewed_at ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2 text-green-600">
                                            <RefreshCw className="h-4 w-4" />
                                            <span className="font-medium">Policy Renewed</span>
                                        </div>
                                        <p className="text-sm text-gray-600">Renewed on {formatDate(policy.renewed_at)}</p>
                                    </div>
                                ) : (
                                    <div className="py-4 text-center">
                                        <Clock className="mx-auto h-8 w-8 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No renewal history</h3>
                                        <p className="mt-1 text-sm text-gray-500">This policy has not been renewed yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Notification Logs */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center space-x-2">
                                        <Mail className="h-5 w-5" />
                                        <span>Notification Logs</span>
                                    </CardTitle>
                                    {renewalHistory.reminders_sent && renewalHistory.reminders_sent.length > 0 && (
                                        <Button variant="ghost" size="sm" onClick={clearNotificationLogs}>
                                            Clear
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {renewalHistory.reminders_sent && renewalHistory.reminders_sent.length > 0 ? (
                                    <div className="space-y-4">
                                        {renewalHistory.reminders_sent.map((log) => (
                                            <div key={log.id} className="flex items-start justify-between rounded-md border p-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">Via {log.channel.toUpperCase()}</span>
                                                        <Badge variant={log.is_successful ? 'default' : 'destructive'} className="h-4 text-[10px]">
                                                            {log.is_successful ? 'Success' : 'Failed'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">To: {log.recipient}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">Type: {log.notice_type} notice</p>
                                                </div>
                                                <div className="pl-2 text-right text-xs text-muted-foreground">{formatDate(log.created_at)}</div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center">
                                        <Mail className="mx-auto h-8 w-8 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications sent</h3>
                                        <p className="mt-1 text-sm text-gray-500">No automatic or manual renewal notices have been sent yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Financial Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <DollarSign className="h-5 w-5" />
                                    <span>Financial Summary</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Premium Amount</span>
                                        <span className="text-sm font-medium">{formatCurrency(policy.premium_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Commission</span>
                                        <span className="text-sm font-medium">{formatCurrency(policy.commission_amount)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium text-gray-900">Total Amount</span>
                                        <span className="text-sm font-bold">{formatCurrency(policy.total_amount)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Outstanding Debits */}
                        {policy.debit_notes.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <CreditCard className="h-5 w-5" />
                                        <span>Outstanding Debits</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {policy.debit_notes.map((note) => (
                                            <div key={note.id} className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium">{note.note_number}</p>
                                                    <p className="text-xs text-gray-500">Due: {note.due_date ? formatDate(note.due_date) : 'N/A'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium">{formatCurrency(note.amount)}</p>
                                                    <Badge variant={note.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                                                        {note.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button onClick={processRenewal} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Process Renewal
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full">
                                            <Send className="mr-2 h-4 w-4" />
                                            Send Reminder
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        <DropdownMenuItem onClick={() => sendReminder('email')}>Via Email</DropdownMenuItem>
                                        {canUseSms ? (
                                            <DropdownMenuItem onClick={() => sendReminder('sms')}>Via SMS</DropdownMenuItem>
                                        ) : (
                                            <DropdownMenuItem
                                                onClick={() => router.visit(upgradeUrl)}
                                                className="text-muted-foreground cursor-not-allowed"
                                            >
                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                Via SMS (Enterprise)
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem onClick={() => sendReminder('portal')}>Via Portal</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => sendReminderToAllChannels()}>To All Channels</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button asChild variant="outline" className="w-full">
                                    <Link href={route('policy-management.show', policy?.id)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Full Policy
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Important Dates */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <Calendar className="h-5 w-5" />
                                    <span>Important Dates</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Policy Start</span>
                                        <span className="text-sm">{formatDate(policy.effective_date)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500">Policy Expiry</span>
                                        <span className="text-sm font-medium text-red-600">{formatDate(policy.expiry_date)}</span>
                                    </div>
                                    {policy.issued_at && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Issued</span>
                                            <span className="text-sm">{formatDate(policy.issued_at)}</span>
                                        </div>
                                    )}
                                    {policy.renewed_at && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-500">Last Renewal</span>
                                            <span className="text-sm">{formatDate(policy.renewed_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
