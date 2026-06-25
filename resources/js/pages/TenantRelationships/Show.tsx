import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, CheckCircle, Clock, FileText, Globe, Mail, MapPin, Phone, Trash2, User, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Tenant {
    id: number;
    name: string;
    company_name: string;
    type: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    license_number?: string;
    website?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
}

interface TenantRelationship {
    id: number;
    requester_id: number;
    requested_id: number;
    status: 'pending' | 'accepted' | 'declined' | 'removed';
    relationship_type: string;
    request_message?: string;
    decline_reason?: string;
    created_at: string;
    accepted_at?: string;
    declined_at?: string;
    removed_at?: string;
    requester: Tenant;
    requested: Tenant;
    actioned_by_user?: User;
}

interface Props {
    relationship: TenantRelationship;
    currentTenant: {
        id: number;
        type: string;
    };
}

export default function Show({ relationship, currentTenant }: Props) {
    const [processing, setProcessing] = useState(false);

    const isRequester = relationship.requester_id === currentTenant.id;
    const otherTenant = isRequester ? relationship.requested : relationship.requester;
    const isPending = relationship.status === 'pending';
    const isAccepted = relationship.status === 'accepted';
    const isDeclined = relationship.status === 'declined';
    const isRemoved = relationship.status === 'removed';

    const handleAccept = () => {
        if (confirm('Are you sure you want to accept this relationship request?')) {
            setProcessing(true);
            router.post(
                route('tenant-relationships.accept', relationship.id),
                {},
                {
                    onFinish: () => setProcessing(false),
                },
            );
        }
    };

    const handleDecline = () => {
        const reason = prompt('Optional: Provide a reason for declining this request');
        if (reason !== null) {
            setProcessing(true);
            router.post(
                route('tenant-relationships.decline', relationship.id),
                { decline_reason: reason },
                {
                    onFinish: () => setProcessing(false),
                },
            );
        }
    };

    const handleRemove = () => {
        if (confirm('Are you sure you want to remove this relationship? This action cannot be undone.')) {
            setProcessing(true);
            router.delete(route('tenant-relationships.destroy', relationship.id), {
                onFinish: () => setProcessing(false),
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants = {
            pending: { variant: 'outline' as const, icon: Clock, className: 'border-yellow-500 text-yellow-700' },
            accepted: { variant: 'outline' as const, icon: CheckCircle, className: 'border-green-500 text-green-700' },
            declined: { variant: 'outline' as const, icon: XCircle, className: 'border-red-500 text-red-700' },
            removed: { variant: 'outline' as const, icon: Trash2, className: 'border-gray-500 text-gray-700' },
        };

        const config = variants[status as keyof typeof variants];
        const Icon = config.icon;

        return (
            <Badge variant={config.variant} className={config.className}>
                <Icon className="mr-1 h-4 w-4" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout>
            <Head title={`Relationship with ${otherTenant.company_name || otherTenant.name}`} />

            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href={route('tenant-relationships.index')}>
                        <Button variant="ghost" size="sm" className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Relationships
                        </Button>
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Business Relationship Details</h1>
                            <p className="mt-2 text-gray-600">
                                {isRequester ? 'Sent to' : 'Received from'} {otherTenant.company_name || otherTenant.name}
                            </p>
                        </div>
                        {getStatusBadge(relationship.status)}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Partner Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Partner Information</CardTitle>
                                <CardDescription>Details about your business partner</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-start gap-4">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                                        <Building2 className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-semibold">{otherTenant.company_name || otherTenant.name}</h3>
                                        <p className="mt-1 text-sm text-gray-600 capitalize">{otherTenant.type}</p>

                                        <div className="mt-4 space-y-3">
                                            {otherTenant.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-4 w-4 text-gray-500" />
                                                    <a href={`mailto:${otherTenant.email}`} className="text-blue-600 hover:underline">
                                                        {otherTenant.email}
                                                    </a>
                                                </div>
                                            )}

                                            {otherTenant.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-4 w-4 text-gray-500" />
                                                    <a href={`tel:${otherTenant.phone}`} className="text-blue-600 hover:underline">
                                                        {otherTenant.phone}
                                                    </a>
                                                </div>
                                            )}

                                            {(otherTenant.city || otherTenant.state || otherTenant.country) && (
                                                <div className="flex items-start gap-2 text-sm">
                                                    <MapPin className="mt-0.5 h-4 w-4 text-gray-500" />
                                                    <span className="text-gray-700">
                                                        {[otherTenant.address, otherTenant.city, otherTenant.state, otherTenant.country]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </span>
                                                </div>
                                            )}

                                            {otherTenant.website && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Globe className="h-4 w-4 text-gray-500" />
                                                    <a
                                                        href={otherTenant.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {otherTenant.website}
                                                    </a>
                                                </div>
                                            )}

                                            {otherTenant.license_number && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileText className="h-4 w-4 text-gray-500" />
                                                    <span className="text-gray-700">
                                                        <strong>License:</strong> {otherTenant.license_number}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Request Message */}
                        {relationship.request_message && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Request Message</CardTitle>
                                    <CardDescription>
                                        Message from {relationship.requester.company_name || relationship.requester.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg bg-blue-50 p-4">
                                        <p className="text-gray-700">{relationship.request_message}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Decline Reason */}
                        {relationship.decline_reason && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Decline Reason</CardTitle>
                                    <CardDescription>
                                        Reason provided by {relationship.requested.company_name || relationship.requested.name}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="rounded-lg bg-red-50 p-4">
                                        <p className="text-red-700">{relationship.decline_reason}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                                <CardDescription>Manage this business relationship</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {isPending && !isRequester && (
                                        <>
                                            <Button onClick={handleAccept} disabled={processing}>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Accept Request
                                            </Button>
                                            <Button variant="outline" onClick={handleDecline} disabled={processing}>
                                                <XCircle className="mr-2 h-4 w-4" />
                                                Decline Request
                                            </Button>
                                        </>
                                    )}

                                    {isPending && isRequester && (
                                        <Button variant="outline" onClick={handleRemove} disabled={processing}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Cancel Request
                                        </Button>
                                    )}

                                    {isAccepted && (
                                        <Button variant="destructive" onClick={handleRemove} disabled={processing}>
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Remove Partnership
                                        </Button>
                                    )}

                                    {(isDeclined || isRemoved) && (
                                        <Link href={route('tenant-relationships.discover')}>
                                            <Button>Discover Other Partners</Button>
                                        </Link>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Relationship Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Relationship Timeline</CardTitle>
                                <CardDescription>Key events in this partnership</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Created */}
                                    <div className="flex gap-3">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                            <Calendar className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold">Request Sent</p>
                                            <p className="text-xs text-gray-600">{formatDate(relationship.created_at)}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                By {relationship.requester.company_name || relationship.requester.name}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Accepted */}
                                    {relationship.accepted_at && (
                                        <>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">Request Accepted</p>
                                                    <p className="text-xs text-gray-600">{formatDate(relationship.accepted_at)}</p>
                                                    {relationship.actioned_by_user && (
                                                        <p className="mt-1 text-xs text-gray-500">By {relationship.actioned_by_user.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Separator />
                                        </>
                                    )}

                                    {/* Declined */}
                                    {relationship.declined_at && (
                                        <>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100">
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">Request Declined</p>
                                                    <p className="text-xs text-gray-600">{formatDate(relationship.declined_at)}</p>
                                                    {relationship.actioned_by_user && (
                                                        <p className="mt-1 text-xs text-gray-500">By {relationship.actioned_by_user.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Separator />
                                        </>
                                    )}

                                    {/* Removed */}
                                    {relationship.removed_at && (
                                        <>
                                            <div className="flex gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                                    <Trash2 className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-semibold">Partnership Removed</p>
                                                    <p className="text-xs text-gray-600">{formatDate(relationship.removed_at)}</p>
                                                    {relationship.actioned_by_user && (
                                                        <p className="mt-1 text-xs text-gray-500">By {relationship.actioned_by_user.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Relationship Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Relationship Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-700">Relationship ID</p>
                                        <p className="text-gray-600">#{relationship.id}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="font-semibold text-gray-700">Type</p>
                                        <p className="text-gray-600 capitalize">{relationship.relationship_type.replace('_', ' ')}</p>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="font-semibold text-gray-700">Direction</p>
                                        <p className="text-gray-600">{isRequester ? 'Outgoing Request' : 'Incoming Request'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
