import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Tenant, type User } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    AlertOctagon,
    AlertTriangle,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    Crown,
    History,
    Mail,
    Phone,
    RefreshCw,
    Shield,
    ShieldAlert,
    ShieldCheck,
    User as UserIcon,
    Users,
    Wifi,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface AuditLogItem {
    id: number;
    action: string;
    description: string;
    metadata?: Record<string, any> | null;
    ip_address?: string | null;
    created_at: string;
    user?: { id: number; name: string; email: string };
}

interface UserShowProps {
    user: User & {
        status?: string;
        approval_method?: string | null;
        approved_at?: string | null;
        last_verification_sent_at?: string | null;
        approved_by_user?: { id: number; name: string; email: string } | null;
        tenant?: Tenant & {
            customers?: Array<{
                id: number;
                first_name?: string;
                last_name?: string;
                company_name?: string;
                created_at: string;
            }>;
        };
        roles?: Array<{
            id: number;
            name: string;
            permissions?: Array<{ name: string }>;
        }>;
    };
    stats: {
        total_customers: number;
        active_policies: number;
        total_quotes: number;
        last_login: string | null;
    };
    auditLogs?: AuditLogItem[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Super Admin',
        href: route('admin.dashboard'),
    },
    {
        title: 'Users',
        href: route('admin.users.index'),
    },
    {
        title: 'User Details',
        href: '#',
    },
];

export default function UserShow({ user, stats, auditLogs = [] }: UserShowProps) {
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const initials =
        user.name
            ?.split(' ')
            .map((name) => name[0])
            .join('')
            .toUpperCase() || 'U';

    const handleApprove = () => {
        router.post(
            route('admin.users.force-verify-email', user.id),
            {},
            {
                onSuccess: () => setShowApproveModal(false),
            },
        );
    };

    const handleResend = () => {
        router.post(route('admin.users.resend-verification', user.id));
    };

    const handleReject = () => {
        router.post(
            route('admin.users.reject', user.id),
            { reason: rejectReason },
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectReason('');
                },
            },
        );
    };

    const handleRevoke = () => {
        router.post(
            route('admin.users.revoke-verification', user.id),
            {},
            {
                onSuccess: () => setShowRevokeModal(false),
            },
        );
    };

    const getStatusBadge = (userObj: typeof user) => {
        const isVerified = !!userObj.email_verified_at;
        const status = userObj.status || (isVerified ? 'active' : 'pending_verification');

        switch (status) {
            case 'pending_verification':
                return (
                    <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                        <Clock className="mr-1 h-3.5 w-3.5 text-amber-500" />
                        Pending Verification
                    </Badge>
                );
            case 'active':
                return (
                    <Badge variant="outline" className="border-green-400 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5 text-green-500" />
                        Active
                    </Badge>
                );
            case 'suspended':
                return (
                    <Badge variant="outline" className="border-yellow-400 bg-yellow-50 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300">
                        <AlertTriangle className="mr-1 h-3.5 w-3.5 text-yellow-500" />
                        Suspended
                    </Badge>
                );
            case 'disabled':
                return (
                    <Badge variant="outline" className="border-red-400 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300">
                        <XCircle className="mr-1 h-3.5 w-3.5 text-red-500" />
                        Disabled / Rejected
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - Verification & Account Details`} />

            <div className="space-y-6">
                {/* Top Action Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">{user.name}</h2>
                        <p className="text-muted-foreground">Detailed account status, approval lifecycle, and audit history.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {!user.email_verified_at ? (
                            <>
                                <Button
                                    className="bg-purple-600 hover:bg-purple-700 text-white"
                                    onClick={() => setShowApproveModal(true)}
                                >
                                    <ShieldCheck className="mr-2 h-4 w-4" />
                                    Manually Approve User
                                </Button>
                                <Button variant="outline" onClick={handleResend}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Resend Verification Email
                                </Button>
                                <Button variant="destructive" onClick={() => setShowRejectModal(true)}>
                                    <AlertOctagon className="mr-2 h-4 w-4" />
                                    Reject Request
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-50" onClick={() => setShowRevokeModal(true)}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Revoke Verification
                            </Button>
                        )}
                        <Button variant="outline" asChild>
                            <Link href={route('admin.users.edit', user.id)}>Edit User Profile</Link>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Left Column: User Info & Verification Card */}
                    <div className="space-y-6 md:col-span-2">
                        {/* Basic Info Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <UserIcon className="mr-2 h-5 w-5" />
                                    User Profile & Account Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start space-x-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={user.avatar_url} alt={user.name} />
                                        <AvatarFallback className="text-xl font-bold">{initials}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-2xl font-bold">{user.name}</h3>
                                                {user.is_online ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                                                        <Wifi className="h-3 w-3" /> Online
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                        Offline
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>

                                        <div className="flex items-center space-x-3">{getStatusBadge(user)}</div>

                                        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                                            <div className="flex items-center">
                                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>{user.email}</span>
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center">
                                                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>{user.phone}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                <span>Registered {new Date(user.created_at).toLocaleDateString()}</span>
                                            </div>
                                            {user.last_active_at && (
                                                <div className="flex items-center">
                                                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <span>Last active {formatDistanceToNow(new Date(user.last_active_at), { addSuffix: true })}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Verification & Approval Details */}
                        <Card className="border-purple-200 shadow-sm dark:border-purple-900/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center text-purple-900 dark:text-purple-300">
                                    <ShieldCheck className="mr-2 h-5 w-5 text-purple-600" />
                                    Verification & Manual Approval Record
                                </CardTitle>
                                <CardDescription>Tracking approval provenance, verification emails, and Super Admin overrides.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 rounded-lg bg-purple-50/50 p-4 dark:bg-purple-950/20 sm:grid-cols-2">
                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Email Verification Status</div>
                                        <div className="mt-1 font-semibold">
                                            {user.email_verified_at ? (
                                                <span className="text-green-700 dark:text-green-400">Verified ({new Date(user.email_verified_at).toLocaleDateString()})</span>
                                            ) : (
                                                <span className="text-amber-700 dark:text-amber-400">Unverified / Pending</span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs font-medium text-muted-foreground">Approval Method</div>
                                        <div className="mt-1 font-semibold">
                                            {user.approval_method === 'manual' ? (
                                                <Badge variant="default" className="border-purple-300 bg-purple-100 text-purple-800">
                                                    Manual Super Admin Approval
                                                </Badge>
                                            ) : user.approval_method === 'email' ? (
                                                <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">
                                                    Email Link Verification
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-500">Not Approved Yet</span>
                                            )}
                                        </div>
                                    </div>

                                    {user.approved_by_user && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground">Approved By Administrator</div>
                                            <div className="mt-1 flex items-center font-semibold text-purple-900 dark:text-purple-300">
                                                <Crown className="mr-1.5 h-4 w-4 text-purple-600" />
                                                {user.approved_by_user.name} ({user.approved_by_user.email})
                                            </div>
                                        </div>
                                    )}

                                    {user.approved_at && (
                                        <div>
                                            <div className="text-xs font-medium text-muted-foreground">Approved Timestamp</div>
                                            <div className="mt-1 font-semibold">{new Date(user.approved_at).toLocaleString()}</div>
                                        </div>
                                    )}

                                    {user.last_verification_sent_at && (
                                        <div className="sm:col-span-2">
                                            <div className="text-xs font-medium text-muted-foreground">Last Verification Email Dispatched</div>
                                            <div className="mt-1 font-medium text-slate-700 dark:text-slate-300">
                                                {new Date(user.last_verification_sent_at).toLocaleString()} ({formatDistanceToNow(new Date(user.last_verification_sent_at), { addSuffix: true })})
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Audit Trail Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <History className="mr-2 h-5 w-5" />
                                    Verification Audit History
                                </CardTitle>
                                <CardDescription>Immutable record of all verification emails, manual approvals, and status changes.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {auditLogs.length > 0 ? (
                                    <div className="relative border-l border-slate-200 pl-6 dark:border-slate-800 space-y-6">
                                        {auditLogs.map((log) => (
                                            <div key={log.id} className="relative">
                                                <span className="absolute -left-[31px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 ring-4 ring-background dark:bg-slate-800">
                                                    <Activity className="h-3 w-3 text-primary" />
                                                </span>
                                                <div className="space-y-1">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold text-foreground">{log.action.replace(/_/g, ' ').toUpperCase()}</span>
                                                        <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{log.description}</p>
                                                    {log.user && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Performed by: <span className="font-medium text-foreground">{log.user.name}</span> ({log.user.email})
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-sm text-muted-foreground">No audit logs recorded for this user yet.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Tenant Info & Quick Stats */}
                    <div className="space-y-6">
                        {/* Tenant Card */}
                        {user.tenant ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center text-base">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        Associated Tenant
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="font-bold text-base">{user.tenant.name}</div>
                                    <div className="text-muted-foreground">{user.tenant.email}</div>
                                    <Badge variant="outline" className="capitalize">{user.tenant.type}</Badge>
                                    <Separator />
                                    <Button variant="outline" size="sm" className="w-full" asChild>
                                        <Link href={route('admin.tenants.show', user.tenant.id)}>View Tenant Details</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center text-base text-purple-900 dark:text-purple-300">
                                        <Crown className="mr-2 h-4 w-4 text-purple-600" />
                                        Platform Administrator
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-xs text-purple-800 dark:text-purple-300">
                                    This user is a platform Super Admin and is not scoped to a specific tenant organization.
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Manual Approve Dialog */}
            <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-purple-700">
                            <ShieldCheck className="h-5 w-5" />
                            Confirm Manual Approval
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to manually verify and approve <strong>{user.name}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowApproveModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleApprove} className="bg-purple-600 hover:bg-purple-700 text-white">
                            Approve & Verify Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-700">
                            <AlertOctagon className="h-5 w-5" />
                            Reject User Registration
                        </DialogTitle>
                        <DialogDescription>
                            Rejecting <strong>{user.name}</strong> will disable their account access.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="reason">Reason for rejection (Optional):</Label>
                        <Textarea
                            id="reason"
                            placeholder="Enter rejection reason..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReject} variant="destructive">
                            Reject User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Dialog */}
            <Dialog open={showRevokeModal} onOpenChange={setShowRevokeModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <RefreshCw className="h-5 w-5" />
                            Revoke Verification
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke verification for <strong>{user.name}</strong>? Their status will return to Pending Verification.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRevokeModal(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleRevoke} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Revoke Verification
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
